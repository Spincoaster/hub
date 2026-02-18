import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";
import { RecordList } from "@/components/RecordList";
import { getSessionId } from "@/lib/session";
import { NAV, TABLE } from "@/lib/labels";

export const dynamic = "force-dynamic";

function TableHeader() {
  return (
    <div className="hidden items-stretch border-b border-zinc-600 text-xs font-semibold text-white md:flex">
      <span className="flex min-w-0 flex-1 items-stretch">
        <span className="flex w-1/2 items-center py-2 pl-2 pr-4">{TABLE.title}</span>
        <span className="w-px self-stretch bg-zinc-600" />
        <span className="flex w-1/2 items-center py-2 pl-4">{TABLE.albumArtist}</span>
      </span>
      <span className="w-16 shrink-0 pr-2" />
    </div>
  );
}

export default async function TrackTop100Page({
  params,
}: {
  params: Promise<{ bar: string }>;
}) {
  const { bar } = await params;

  const topTrackLikes = await prisma.like.groupBy({
    by: ["trackId"],
    where: { trackId: { not: null } },
    _count: { trackId: true },
    orderBy: { _count: { trackId: "desc" } },
    take: 100,
  });

  const topTrackIds = topTrackLikes
    .map((l) => l.trackId)
    .filter((id): id is bigint => id !== null);

  const topTracks =
    topTrackIds.length > 0
      ? await prisma.track.findMany({
          where: { id: { in: topTrackIds } },
          include: { artist: true, album: true },
        })
      : [];

  // Build likeCounts map
  const likeCounts: Record<string, number> = {};
  for (const l of topTrackLikes) {
    if (l.trackId) likeCounts[String(l.trackId)] = l._count.trackId;
  }

  // Build likeMap for current session
  const sessionId = await getSessionId();
  let likeMap: Record<string, string> = {};
  if (sessionId && topTrackIds.length > 0) {
    const likes = await prisma.like.findMany({
      where: { sessionId, trackId: { in: topTrackIds } },
    });
    for (const like of likes) {
      if (like.trackId) likeMap[String(like.trackId)] = String(like.id);
    }
  }

  const tracks = serializeBigInt(topTracks);

  // Sort by like count (groupBy order)
  const trackOrder = new Map(topTrackIds.map((id, i) => [String(id), i]));

  const trackItems = tracks
    .sort(
      (a, b) =>
        (trackOrder.get(String(a.id)) ?? 999) -
        (trackOrder.get(String(b.id)) ?? 999),
    )
    .map((t) => ({
      id: String(t.id),
      name: t.name ?? "—",
      artistName: t.artist?.name ?? "—",
      albumName: t.album?.name ?? "—",
      number: t.number,
      type: "Hi-Res" as const,
    }));

  return (
    <div className="mx-auto max-w-7xl px-4">

      <h1 className="mb-6 text-3xl font-bold">{NAV.popularHiRes}</h1>

      <TableHeader />
      <RecordList items={trackItems} likeMap={likeMap} likeCounts={likeCounts} />
    </div>
  );
}
