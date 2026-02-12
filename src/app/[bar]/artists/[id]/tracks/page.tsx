import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";
import { RecordList } from "@/components/RecordList";
import { getSessionId } from "@/lib/session";

export default async function ArtistTracksPage({
  params,
}: {
  params: Promise<{ bar: string; id: string }>;
}) {
  const { id } = await params;

  const artist = await prisma.artist.findUnique({
    where: { id: BigInt(id) },
    include: {
      tracks: {
        include: { album: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!artist) notFound();

  const tracks = serializeBigInt(artist.tracks);

  const items = tracks.map((t) => ({
    id: String(t.id),
    name: t.name ?? "—",
    artistName: artist.name ?? "—",
    albumName: t.album?.name ?? "—",
    number: t.number,
    type: "Hi-Res" as const,
  }));

  const trackIds = tracks.map((t) => BigInt(t.id));

  // Like counts
  const likeCounts: Record<string, number> = {};
  if (trackIds.length > 0) {
    const counts = await prisma.like.groupBy({
      by: ["trackId"],
      where: { trackId: { in: trackIds } },
      _count: { trackId: true },
    });
    for (const c of counts) {
      if (c.trackId) likeCounts[String(c.trackId)] = c._count.trackId;
    }
  }

  // Session likeMap
  const sessionId = await getSessionId();
  let likeMap: Record<string, string> = {};
  if (sessionId && trackIds.length > 0) {
    const likes = await prisma.like.findMany({
      where: { sessionId, trackId: { in: trackIds } },
    });
    for (const like of likes) {
      if (like.trackId) likeMap[String(like.trackId)] = String(like.id);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4">
      <div className="mb-6">
        <h1 className="text-5xl font-light tracking-tight md:text-7xl">
          {artist.name}
        </h1>
        <p className="mt-2 text-sm text-white">[ Hi-Res Tracks ]</p>
      </div>

      <div className="flex flex-col">
        <div className="flex border-b border-zinc-700 py-2 text-xs font-semibold text-white">
          <span className="w-2/5">Artists</span>
          <span className="w-2/5">Albums</span>
          <span className="w-1/5" />
        </div>
        <RecordList items={items} likeMap={likeMap} likeCounts={likeCounts} />
        {items.length === 0 && (
          <p className="py-8 text-center text-white">No tracks found.</p>
        )}
      </div>
    </div>
  );
}
