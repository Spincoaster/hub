import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { GoogleAuth } from "google-auth-library";

export const maxDuration = 300;

const SPREADSHEET_ID = "1Zl5dVBUjs1Tp2WEhS79GPtqgwQf69N9sNUghiNccdZ8";

interface SheetConfig {
  sheetName: string;
  bar: number;
  locationCol: number;
  numberCol: number;
  ownerCol: number;
  titleCol: number;
  artistCol: number;
  commentCol: number;
  minCols: number;
}

const SHEET_CONFIGS: SheetConfig[] = [
  {
    sheetName: "新宿レコードリスト",
    bar: 0,
    locationCol: 0,
    numberCol: 1,
    ownerCol: 2,
    titleCol: 3,
    artistCol: 4,
    commentCol: 5,
    minCols: 5,
  },
  {
    sheetName: "恵比寿レコードリスト",
    bar: 1,
    locationCol: 1,
    numberCol: 2,
    ownerCol: 3,
    titleCol: 4,
    artistCol: 5,
    commentCol: 6,
    minCols: 6,
  },
  {
    sheetName: "神楽坂レコードリスト",
    bar: 2,
    locationCol: 0,
    numberCol: 1,
    ownerCol: 2,
    titleCol: 3,
    artistCol: 4,
    commentCol: 5,
    minCols: 5,
  },
];

interface RowData {
  location: string;
  number: number;
  ownerName: string;
  title: string;
  artistName: string;
  comment: string;
  bar: number;
}

function parseServiceAccountKey(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    // dotenv may expand \n to real newlines, breaking JSON string values.
    // Re-escape newlines only inside JSON string literals.
    const fixed = raw.replace(/"(?:[^"\\]|\\.)*"/g, (match) =>
      match.replace(/\n/g, "\\n"),
    );
    return JSON.parse(fixed);
  }
}

async function getAccessToken(): Promise<string> {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not set");

  const key = parseServiceAccountKey(keyJson);
  const auth = new GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse.token) throw new Error("Failed to get access token");
  return tokenResponse.token;
}

async function fetchSheetData(
  sheetName: string,
  accessToken: string,
): Promise<string[][]> {
  const range = encodeURIComponent(sheetName);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok)
    throw new Error(`Sheets API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return (data.values as string[][]) ?? [];
}

function parseRows(rows: string[][], config: SheetConfig): RowData[] {
  const result: RowData[] = [];

  // Skip header row (index 0)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length < config.minCols) continue;

    const title = row[config.titleCol]?.trim();
    const numberStr = row[config.numberCol]?.trim();

    if (!title || !numberStr) continue;

    const number = parseInt(numberStr, 10);
    if (isNaN(number)) continue;

    result.push({
      location: row[config.locationCol]?.trim() || "",
      number,
      ownerName: row[config.ownerCol]?.trim() || "",
      title,
      artistName: row[config.artistCol]?.trim() || "",
      comment: row[config.commentCol]?.trim() || "",
      bar: config.bar,
    });
  }

  return result;
}

async function acquireLock(bar: number): Promise<bigint | null> {
  // Create job first, then check for older running jobs (avoids race condition)
  const job = await prisma.syncJob.create({
    data: { bar, status: "running" },
  });

  const olderRunning = await prisma.syncJob.findFirst({
    where: { bar, status: "running", id: { lt: job.id } },
  });

  if (olderRunning) {
    // Another job started first — release ours
    await prisma.syncJob.delete({ where: { id: job.id } });
    return null;
  }

  return job.id;
}

async function completeLock(
  jobId: bigint,
  result: Record<string, unknown>,
): Promise<void> {
  await prisma.syncJob.update({
    where: { id: jobId },
    data: {
      status: "completed",
      finishedAt: new Date(),
      result: JSON.stringify(result),
    },
  });
}

async function failLock(jobId: bigint, error: string): Promise<void> {
  await prisma.syncJob.update({
    where: { id: jobId },
    data: {
      status: "failed",
      finishedAt: new Date(),
      error,
    },
  });
}

interface ChangeEntry {
  type: "created" | "updated" | "deleted" | "duplicated";
  name: string;
  artist: string;
  owner: string;
  number: number;
  fields?: string[];
}

async function syncBar(config: SheetConfig, accessToken: string) {
  console.log(`[sync] Starting sync for ${config.sheetName} (bar=${config.bar})`);
  const sheetData = await fetchSheetData(config.sheetName, accessToken);
  const rows = parseRows(sheetData, config);
  console.log(`[sync] Parsed ${rows.length} rows from sheet`);

  // Collect unique artist and owner names
  const artistNames = [
    ...new Set(rows.map((r) => r.artistName).filter(Boolean)),
  ];
  const ownerNames = [
    ...new Set(rows.map((r) => r.ownerName).filter(Boolean)),
  ];

  // Load existing artists (group by name, take first match)
  const existingArtists = await prisma.artist.findMany({
    where: { name: { in: artistNames } },
  });
  const artistMap = new Map<string, bigint>();
  for (const a of existingArtists) {
    if (a.name && !artistMap.has(a.name)) {
      artistMap.set(a.name, a.id);
    }
  }

  // Load existing owners
  const existingOwners = await prisma.owner.findMany({
    where: { name: { in: ownerNames } },
  });
  const ownerMap = new Map<string, bigint>();
  for (const o of existingOwners) {
    if (o.name && !ownerMap.has(o.name)) {
      ownerMap.set(o.name, o.id);
    }
  }

  // Create missing artists
  for (const name of artistNames) {
    if (!artistMap.has(name)) {
      const artist = await prisma.artist.create({ data: { name } });
      artistMap.set(name, artist.id);
    }
  }

  // Create missing owners
  for (const name of ownerNames) {
    if (!ownerMap.has(name)) {
      const owner = await prisma.owner.create({ data: { name } });
      ownerMap.set(name, owner.id);
    }
  }

  // Load existing records for this bar (full fields for diff comparison)
  const existingRecords = await prisma.record.findMany({
    where: { bar: config.bar },
    include: { artist: { select: { name: true } }, owner: { select: { name: true } } },
  });
  const recordMap = new Map<string, (typeof existingRecords)[number]>();
  for (const r of existingRecords) {
    const key = `${r.location ?? ""}:${r.number}`;
    recordMap.set(key, r);
  }

  let created = 0;
  let updated = 0;
  const changes: ChangeEntry[] = [];

  // Deduplicate rows by key (last occurrence wins)
  const deduped = new Map<string, RowData>();
  const duplicatedKeys = new Set<string>();
  for (const row of rows) {
    const key = `${row.location}:${row.number}`;
    if (deduped.has(key)) {
      duplicatedKeys.add(key);
    }
    deduped.set(key, row);
  }
  const uniqueRows = [...deduped.values()];
  const sheetKeys = new Set(deduped.keys());
  if (duplicatedKeys.size > 0) {
    console.log(`[sync] Deduplicated: ${rows.length} → ${uniqueRows.length} rows (${duplicatedKeys.size} duplicated keys)`);
    for (const key of duplicatedKeys) {
      const row = deduped.get(key)!;
      console.log(`[sync]   duplicate key=${key} → kept "${row.title}" / ${row.artistName}`);
      changes.push({
        type: "duplicated",
        name: row.title,
        artist: row.artistName,
        owner: row.ownerName,
        number: row.number,
      });
    }
  }

  for (const row of uniqueRows) {
    const key = `${row.location}:${row.number}`;

    const artistId = row.artistName
      ? (artistMap.get(row.artistName) ?? null)
      : null;
    const ownerId = row.ownerName
      ? (ownerMap.get(row.ownerName) ?? null)
      : null;

    const data = {
      name: row.title,
      location: row.location || null,
      number: row.number,
      comment: row.comment || null,
      artistId,
      ownerId,
      bar: row.bar,
    };

    const existing = recordMap.get(key);
    if (existing) {
      // Compare fields to detect actual changes
      const changedFields: string[] = [];
      if (existing.name !== data.name) changedFields.push("name");
      if ((existing.location ?? null) !== data.location) changedFields.push("location");
      if (existing.comment !== data.comment) changedFields.push("comment");
      if (existing.artistId !== data.artistId) changedFields.push("artistId");
      if (existing.ownerId !== data.ownerId) changedFields.push("ownerId");

      if (changedFields.length > 0) {
        console.log(`[sync] UPDATE #${row.number} "${row.title}" changed: [${changedFields.join(", ")}]`);
        for (const f of changedFields) {
          const oldVal = (existing as Record<string, unknown>)[f];
          const newVal = (data as Record<string, unknown>)[f];
          console.log(`[sync]   ${f}: ${String(oldVal)} → ${String(newVal)}`);
        }
        await prisma.record.update({ where: { id: existing.id }, data });
        updated++;
        changes.push({
          type: "updated",
          name: row.title,
          artist: row.artistName,
          owner: row.ownerName,
          number: row.number,
          fields: changedFields,
        });
      }
    } else {
      console.log(`[sync] CREATE #${row.number} "${row.title}"`);
      await prisma.record.create({ data });
      created++;
      changes.push({
        type: "created",
        name: row.title,
        artist: row.artistName,
        owner: row.ownerName,
        number: row.number,
      });
    }
  }

  // Delete records that no longer exist in the sheet
  const toDelete = existingRecords.filter((r) => {
    const key = `${r.location ?? ""}:${r.number}`;
    return !sheetKeys.has(key);
  });

  if (toDelete.length > 0) {
    for (const r of toDelete) {
      console.log(`[sync] DELETE #${r.number} "${r.name}" (key="${r.location ?? ""}:${r.number}")`);
    }
    await prisma.record.deleteMany({
      where: { id: { in: toDelete.map((r) => r.id) } },
    });
    for (const r of toDelete) {
      changes.push({
        type: "deleted",
        name: r.name ?? "",
        artist: r.artist?.name ?? "",
        owner: r.owner?.name ?? "",
        number: r.number ?? 0,
      });
    }
  }

  const result = {
    sheetRows: rows.length,
    created,
    updated,
    deleted: toDelete.length,
    duplicated: duplicatedKeys.size,
    newArtists: artistNames.length - existingArtists.length,
    newOwners: ownerNames.length - existingOwners.length,
    changes,
  };
  console.log(`[sync] Done ${config.sheetName}: created=${created} updated=${updated} deleted=${toDelete.length}`);
  return result;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const barParam = request.nextUrl.searchParams.get("bar");
  const configs = barParam
    ? SHEET_CONFIGS.filter(
        (c) =>
          c.sheetName.startsWith(barParam) || String(c.bar) === barParam,
      )
    : SHEET_CONFIGS;

  if (configs.length === 0) {
    return Response.json(
      { success: false, error: `Unknown bar: ${barParam}` },
      { status: 400 },
    );
  }

  // Acquire locks for each bar
  const jobs: { config: SheetConfig; jobId: bigint }[] = [];
  const skipped: string[] = [];

  for (const config of configs) {
    const jobId = await acquireLock(config.bar);
    if (jobId) {
      jobs.push({ config, jobId });
    } else {
      skipped.push(config.sheetName);
    }
  }

  if (jobs.length === 0) {
    return Response.json(
      {
        success: false,
        error: "All requested bars are already syncing",
        skipped,
      },
      { status: 409 },
    );
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch (error) {
    // Release all locks on auth failure
    for (const { jobId } of jobs) {
      await failLock(jobId, String(error));
    }
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }

  const results: Record<string, unknown> = {};

  for (const { config, jobId } of jobs) {
    try {
      const result = await syncBar(config, accessToken);
      await completeLock(jobId, result);
      results[config.sheetName] = { success: true, ...result };
    } catch (error) {
      await failLock(jobId, String(error));
      results[config.sheetName] = { success: false, error: String(error) };
    }
  }

  return Response.json({
    success: true,
    results,
    ...(skipped.length > 0 ? { skipped } : {}),
  });
}

// POST: triggered from admin UI (session auth)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const barParam = request.nextUrl.searchParams.get("bar");
  const configs = barParam
    ? SHEET_CONFIGS.filter(
        (c) =>
          c.sheetName.startsWith(barParam) || String(c.bar) === barParam,
      )
    : SHEET_CONFIGS;

  if (configs.length === 0) {
    return Response.json(
      { success: false, error: `Unknown bar: ${barParam}` },
      { status: 400 },
    );
  }

  const jobs: { config: SheetConfig; jobId: bigint }[] = [];
  const skipped: string[] = [];

  for (const config of configs) {
    const jobId = await acquireLock(config.bar);
    if (jobId) {
      jobs.push({ config, jobId });
    } else {
      skipped.push(config.sheetName);
    }
  }

  if (jobs.length === 0) {
    return Response.json(
      {
        success: false,
        error: "All requested bars are already syncing",
        skipped,
      },
      { status: 409 },
    );
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken();
  } catch (error) {
    for (const { jobId } of jobs) {
      await failLock(jobId, String(error));
    }
    return Response.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }

  const results: Record<string, unknown> = {};

  for (const { config, jobId } of jobs) {
    try {
      const result = await syncBar(config, accessToken);
      await completeLock(jobId, result);
      results[config.sheetName] = { success: true, ...result };
    } catch (error) {
      await failLock(jobId, String(error));
      results[config.sheetName] = { success: false, error: String(error) };
    }
  }

  return Response.json({
    success: true,
    results,
    ...(skipped.length > 0 ? { skipped } : {}),
  });
}
