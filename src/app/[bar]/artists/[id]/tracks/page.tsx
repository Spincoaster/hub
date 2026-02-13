import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";
import Link from "next/link";
import { BackLink } from "@/components/BackLink";
import { RecordList } from "@/components/RecordList";
import { getSessionId } from "@/lib/session";

export default async function ArtistTracksPage({
  params,
}: {
  params: Promise<{ bar: string; id: string }>;
}) {
  const { bar, id } = await params;

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
    <div className="mx-auto max-w-7xl px-4">
      <div className="-mt-8 mb-6">
        <nav className="flex min-w-0 items-center gap-1 text-sm text-zinc-400">
          <Link href={`/${bar}`} className="shrink-0 hover:text-white">Top</Link>
          <span className="shrink-0">/</span>
          <BackLink label="All Hi-Res List" href={`/${bar}/tracks/artists`} className="truncate" />
        </nav>
        <h1 className="mt-2 text-4xl font-normal tracking-tight">
          {artist.name}
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
