import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BAR_VALUES, serializeBigInt } from "@/lib/utils";

import { RecordList } from "@/components/RecordList";
import { getSessionId } from "@/lib/session";
import { getAdjustedRecordLikeCounts } from "@/lib/ranking-adjustments";

export default async function ArtistRecordsPage({
  params,
}: {
  params: Promise<{ bar: string; id: string }>;
}) {
  const { bar, id } = await params;

  const barFilter = { bar: BAR_VALUES[bar] };

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
    albumName: "",
    number: r.number,
    type: "Record" as const,
    ownerName: r.owner?.name ?? undefined,
    location: r.location ?? undefined,
  }));

  const recordIds = records.map((r) => BigInt(r.id));

  // Like counts
  const likeCounts = await getAdjustedRecordLikeCounts(recordIds);

  // Session likeMap
  const sessionId = await getSessionId();
  const likeMap: Record<string, string> = {};
  if (sessionId && recordIds.length > 0) {
    const likes = await prisma.like.findMany({
      where: { sessionId, recordId: { in: recordIds } },
    });
    for (const like of likes) {
      if (like.recordId) likeMap[String(like.recordId)] = String(like.id);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="mb-6">
        <h1 className="mt-2 text-4xl font-normal tracking-tight">
          {artist.name}
        </h1>
        <p className="mt-2 text-sm text-white">[ Records ]</p>
      </div>

      <div className="flex flex-col">
        <RecordList items={items} likeMap={likeMap} likeCounts={likeCounts} singleColumn />
        {items.length === 0 && (
          <p className="py-8 text-center text-white">No records found.</p>
        )}
      </div>
    </div>
  );
}
