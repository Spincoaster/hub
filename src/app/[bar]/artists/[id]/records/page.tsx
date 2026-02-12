import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BAR_VALUES, serializeBigInt } from "@/lib/utils";
import { RecordList } from "@/components/RecordList";
import { getSessionId } from "@/lib/session";

export default async function ArtistRecordsPage({
  params,
}: {
  params: Promise<{ bar: string; id: string }>;
}) {
  const { bar, id } = await params;

  const barFilter =
    bar === "ebisu"
      ? { bar: BAR_VALUES.ebisu }
      : bar === "shinjuku"
        ? { bar: { not: BAR_VALUES.ebisu } }
        : {};

  const artist = await prisma.artist.findUnique({
    where: { id: BigInt(id) },
    include: {
      records: {
        include: { owner: true },
        where: barFilter,
        orderBy: { name: "asc" },
      },
    },
  });

  if (!artist) notFound();

  const records = serializeBigInt(artist.records);

  const items = records.map((r) => ({
    id: String(r.id),
    name: r.name ?? "—",
    artistName: artist.name ?? "—",
    albumName: r.name ?? "—",
    number: r.number,
    type: "Record" as const,
    ownerName: r.owner?.name ?? undefined,
    location: r.location ?? undefined,
  }));

  const recordIds = records.map((r) => BigInt(r.id));

  // Like counts
  const likeCounts: Record<string, number> = {};
  if (recordIds.length > 0) {
    const counts = await prisma.like.groupBy({
      by: ["recordId"],
      where: { recordId: { in: recordIds } },
      _count: { recordId: true },
    });
    for (const c of counts) {
      if (c.recordId) likeCounts[String(c.recordId)] = c._count.recordId;
    }
  }

  // Session likeMap
  const sessionId = await getSessionId();
  let likeMap: Record<string, string> = {};
  if (sessionId && recordIds.length > 0) {
    const likes = await prisma.like.findMany({
      where: { sessionId, recordId: { in: recordIds } },
    });
    for (const like of likes) {
      if (like.recordId) likeMap[String(like.recordId)] = String(like.id);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-5xl font-light tracking-tight md:text-7xl">
          {artist.name}
        </h1>
        <p className="mt-2 text-sm text-white">[ Records ]</p>
      </div>

      <div className="flex flex-col">
        <div className="flex border-b border-zinc-700 py-2 text-xs font-semibold text-white">
          <span className="w-2/5">Artists</span>
          <span className="w-2/5">Albums</span>
          <span className="w-1/5" />
        </div>
        <RecordList items={items} likeMap={likeMap} likeCounts={likeCounts} />
        {items.length === 0 && (
          <p className="py-8 text-center text-white">No records found.</p>
        )}
      </div>
    </div>
  );
}
