import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildPrefixFilter } from "@/lib/utils";
import InitialLetterPagination from "@/components/InitialLetterPagination";
import { NAV, SEARCH } from "@/lib/labels";

export default async function TrackArtistsPage({
  params,
  searchParams,
}: {
  params: Promise<{ bar: string }>;
  searchParams: Promise<{ has_prefix?: string }>;
}) {
  const { bar } = await params;
  const { has_prefix } = await searchParams;
  const hasPrefix = has_prefix ?? "a";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    tracks: { some: {} },
    ...buildPrefixFilter(hasPrefix),
  };

  const artists = await prisma.artist.findMany({
    where,
    orderBy: { name: "asc" },
    take: 500,
  });

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="-mt-8 mb-6">
        <Link
          href={`/${bar}`}
          className="text-sm text-zinc-400 hover:text-white"
        >
          &larr; Top
        </Link>
        <h1 className="mt-2 text-5xl font-normal tracking-tight md:text-7xl">
          {NAV.allHiRes}
        </h1>
      </div>

      <div className="mb-8">
        <InitialLetterPagination
          basePath={`/${bar}/hi-res/artists`}
          currentPrefix={hasPrefix}
        />
      </div>

      <div className="flex flex-col">
        {artists.map((artist) => (
          <Link
            key={Number(artist.id)}
            href={`/${bar}/artists/${Number(artist.id)}/albums`}
            className="group flex items-center justify-between border-b border-zinc-700 py-4 transition-colors hover:bg-white/5"
          >
            <span className="truncate text-white group-hover:text-red-400">{artist.name}</span>
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
        {artists.length === 0 && (
          <p className="py-8 text-center text-zinc-500">{SEARCH.noArtists}</p>
        )}
      </div>
    </div>
  );
}
