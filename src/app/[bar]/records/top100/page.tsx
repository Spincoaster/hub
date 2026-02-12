import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BAR_VALUES, serializeBigInt } from "@/lib/utils";
import { RecordList } from "@/components/RecordList";
import { getSessionId } from "@/lib/session";

export const dynamic = "force-dynamic";

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function TableHeader() {
  return (
    <div className="flex border-b border-zinc-700 py-2 text-xs font-semibold text-zinc-400">
      <span className="w-2/5">Artists</span>
      <span className="w-2/5">Albums</span>
      <span className="w-1/5" />
    </div>
  );
}

export default async function RecordTop100Page({
  params,
}: {
  params: Promise<{ bar: string }>;
}) {
  const { bar } = await params;
  const barValue = BAR_VALUES[bar];

  const topRecordLikes = await prisma.like.groupBy({
    by: ["recordId"],
    where: {
      recordId: { not: null },
      record: { bar: barValue },
    },
    _count: { recordId: true },
    orderBy: { _count: { recordId: "desc" } },
    take: 100,
  });

  const topRecordIds = topRecordLikes
    .map((l) => l.recordId)
    .filter((id): id is bigint => id !== null);

  const topRecords =
    topRecordIds.length > 0
      ? await prisma.record.findMany({
          where: { id: { in: topRecordIds } },
          include: { artist: true, owner: true },
        })
      : [];

  // Build likeCounts map
  const likeCounts: Record<string, number> = {};
  for (const l of topRecordLikes) {
    if (l.recordId) likeCounts[String(l.recordId)] = l._count.recordId;
  }

  // Build likeMap for current session
  const sessionId = await getSessionId();
  let likeMap: Record<string, string> = {};
  if (sessionId && topRecordIds.length > 0) {
    const likes = await prisma.like.findMany({
      where: { sessionId, recordId: { in: topRecordIds } },
    });
    for (const like of likes) {
      if (like.recordId) likeMap[String(like.recordId)] = String(like.id);
    }
  }

  const records = serializeBigInt(topRecords);

  // Sort by like count (groupBy order)
  const recordOrder = new Map(topRecordIds.map((id, i) => [String(id), i]));

  const recordItems = records
    .sort(
      (a, b) =>
        (recordOrder.get(String(a.id)) ?? 999) -
        (recordOrder.get(String(b.id)) ?? 999),
    )
    .map((r) => ({
      id: String(r.id),
      name: r.name ?? "—",
      artistName: r.artist?.name ?? "—",
      albumName: r.name ?? "—",
      number: r.number,
      type: "Record" as const,
      ownerName: r.owner?.name ?? undefined,
      location: r.location ?? undefined,
    }));

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/${bar}`}
          className="text-sm text-zinc-400 hover:text-white hover:underline"
        >
          &larr; {capitalize(bar)} TOP
        </Link>
      </div>

      <h1 className="mb-6 text-3xl font-bold">Record TOP 100</h1>

      <TableHeader />
      <RecordList items={recordItems} likeMap={likeMap} likeCounts={likeCounts} />
    </div>
  );
}
