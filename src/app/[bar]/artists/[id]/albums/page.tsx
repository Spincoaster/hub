import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ArtistAlbumsPage({
  params,
}: {
  params: Promise<{ bar: string; id: string }>;
}) {
  const { bar, id } = await params;

  const artist = await prisma.artist.findUnique({
    where: { id: BigInt(id) },
    include: {
      albums: {
        where: { tracks: { some: {} } },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!artist) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="-mt-8 mb-6">
        <h1 className="mt-2 text-4xl font-normal tracking-tight">
          {artist.name}
        </h1>
        <p className="mt-2 text-sm text-white">[ Hi-Res Albums ]</p>
      </div>

      <div className="flex flex-col">
        {artist.albums.map((album) => (
          <Link
            key={Number(album.id)}
            href={`/${bar}/albums/${Number(album.id)}/tracks`}
            className="group flex items-center justify-between border-b border-zinc-700 first:border-t py-4 transition-colors hover:bg-white/5"
          >
            <span className="truncate text-white group-hover:text-red-400">{album.name}</span>
            <svg
              className="h-5 w-5 shrink-0 text-zinc-500 transition-colors group-hover:text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
        {artist.albums.length === 0 && (
          <p className="py-8 text-center text-white">No albums found.</p>
        )}
      </div>
    </div>
  );
}
