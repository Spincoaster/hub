import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";
import { RecordList } from "@/components/RecordList";

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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-5xl font-light tracking-tight md:text-7xl">
          {artist.name}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">[ Hi-Res Tracks ]</p>
      </div>

      <div className="flex flex-col">
        <div className="flex border-b border-zinc-700 py-2 text-xs font-semibold text-zinc-400">
          <span className="w-2/5">Artists</span>
          <span className="w-2/5">Albums</span>
          <span className="w-1/5" />
        </div>
        <RecordList items={items} />
        {items.length === 0 && (
          <p className="py-8 text-center text-zinc-500">No tracks found.</p>
        )}
      </div>
    </div>
  );
}
