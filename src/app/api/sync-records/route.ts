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

async function syncBar(config: SheetConfig, accessToken: string) {
  const sheetData = await fetchSheetData(config.sheetName, accessToken);
  const rows = parseRows(sheetData, config);

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

  // Load existing records for this bar
  const existingRecords = await prisma.record.findMany({
    where: { bar: config.bar },
    select: { id: true, location: true, number: true },
  });
  const recordMap = new Map<string, bigint>();
  for (const r of existingRecords) {
    const key = `${r.location ?? ""}:${r.number}`;
    recordMap.set(key, r.id);
  }

  let created = 0;
  let updated = 0;

  for (const row of rows) {
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

    const existingId = recordMap.get(key);
    if (existingId) {
      await prisma.record.update({ where: { id: existingId }, data });
      updated++;
    } else {
      const newRecord = await prisma.record.create({ data });
      recordMap.set(key, newRecord.id);
      created++;
    }
  }

  return {
    sheetRows: rows.length,
    created,
    updated,
    newArtists: artistNames.length - existingArtists.length,
    newOwners: ownerNames.length - existingOwners.length,
  };
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
