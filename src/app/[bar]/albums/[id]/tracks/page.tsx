import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";
import { RecordList } from "@/components/RecordList";
import { getSessionId } from "@/lib/session";
import { getAdjustedTrackLikeCounts } from "@/lib/ranking-adjustments";

export default async function AlbumTracksPage({
  params,
}: {
  params: Promise<{ bar: string; id: string }>;
}) {
  const { id } = await params;

  const album = await prisma.album.findUnique({
    where: { id: BigInt(id) },
    include: {
      artist: true,
      tracks: {
        include: { artist: true },
        orderBy: { number: "asc" },
      },
    },
  });

  if (!album) notFound();

  const tracks = serializeBigInt(album.tracks);

  const items = tracks.map((t) => ({
    id: String(t.id),
    name: t.name ?? "—",
    artistName: t.artist?.name ?? album.artist?.name ?? "—",
    albumName: album.name ?? "—",
    number: t.number,
    type: "Hi-Res" as const,
  }));

  const trackIds = tracks.map((t) => BigInt(t.id));

  // Like counts
  const likeCounts = await getAdjustedTrackLikeCounts(trackIds);

  // Session likeMap
  const sessionId = await getSessionId();
  const likeMap: Record<string, string> = {};
  if (sessionId && trackIds.length > 0) {
    const likes = await prisma.like.findMany({
      where: { sessionId, trackId: { in: trackIds } },
    });
    for (const like of likes) {
      if (like.trackId) likeMap[String(like.trackId)] = String(like.id);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="mb-6">
        <h1 className="mt-2 text-4xl font-normal tracking-tight">
          {album.name}
        </h1>
        <p className="mt-2 text-sm text-white">[ Hi-Res Tracks ]</p>
      </div>

      <div className="flex flex-col">
        <RecordList items={items} likeMap={likeMap} likeCounts={likeCounts} singleColumn />
        {items.length === 0 && (
          <p className="py-8 text-center text-white">No tracks found.</p>
        )}
      </div>
    </div>
  );
}
