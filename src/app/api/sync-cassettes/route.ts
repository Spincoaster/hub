import { syncCassetteItems } from "@/lib/sync-cassettes";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchSheetData, getAccessToken } from "@/lib/google-sheets";
import { CASSETTE_BAR, CASSETTE_SHEET, parseCassetteSheet } from "@/lib/cassette-sheet";

export const maxDuration = 300;

async function sync() {
  const job = await prisma.syncJob.create({ data: { bar: CASSETTE_BAR, mediaType: "cassette", status: "running" } });
  try {
    const result = await prisma.$transaction(async (tx) => {
      // A transaction-scoped lock is released even if the process fails.
      const [lock] = await tx.$queryRaw<Array<{ acquired: boolean }>>`SELECT pg_try_advisory_xact_lock(20261014, ${CASSETTE_BAR}::int) AS acquired`;
      if (!lock.acquired) throw new Error("カセットは現在同期中です。");
      const { items, skippedRows } = parseCassetteSheet(await fetchSheetData(CASSETTE_SHEET, await getAccessToken()));
      const result = await syncCassetteItems(tx, { items, skippedRows });
      await tx.syncJob.update({ where: { id: job.id }, data: { status: "completed", finishedAt: new Date(), result: JSON.stringify(result) } });
      return result;
    }, { timeout: 240000, maxWait: 10000 });
    return Response.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await prisma.syncJob.update({ where: { id: job.id }, data: { status: "failed", finishedAt: new Date(), error: message } });
    return Response.json({ success: false, error: message }, { status: message.includes("現在同期中") ? 409 : 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new Response("Unauthorized", { status: 401 });
  return sync();
}

export async function POST() {
  if (!(await auth())) return new Response("Unauthorized", { status: 401 });
  return sync();
}
