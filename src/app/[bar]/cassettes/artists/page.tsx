import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BAR_VALUES, sortAlphaFirst } from "@/lib/utils";
import InitialLetterPagination from "@/components/InitialLetterPagination";
import { NAV, SEARCH } from "@/lib/labels";

export default async function CassetteArtistsPage({
  params,
  searchParams,
}: {
  params: Promise<{ bar: string }>;
  searchParams: Promise<{ has_prefix?: string }>;
}) {
  const { bar } = await params;
  if (bar !== "kagurazaka") notFound();
  const { has_prefix } = await searchParams;
  const hasPrefix = has_prefix ?? undefined;

  const rawArtists = await prisma.artist.findMany({
    where: { cassettes: { some: { bar: BAR_VALUES[bar] } } },
    orderBy: { name: "asc" },
  });
  // New artists from Sheets may not have a phonetic name yet.
  const artists = sortAlphaFirst(rawArtists, (artist) => artist.phoneticName || artist.name)
    .filter((artist) => {
      if (!hasPrefix) return true;
      const name = (artist.phoneticName || artist.name || "").toLowerCase();
      return hasPrefix === "#"
        ? !/^[a-z]/.test(name)
        : name.startsWith(hasPrefix.toLowerCase());
    });

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="mb-6">
        <h1 className="mt-2 text-5xl font-normal tracking-tight md:text-7xl">
          {NAV.allCassettes}
        </h1>
      </div>

      <p className="mb-2 text-sm text-white">{SEARCH.artistLabel}</p>
      <div className="sticky top-0 z-40 mb-8 bg-black pt-1 pb-2">
        <InitialLetterPagination
          basePath={`/${bar}/cassettes/artists`}
          currentPrefix={hasPrefix}
          showAll
        />
      </div>

      <div className="flex flex-col">
        {artists.map((artist) => (
          <Link
            key={String(artist.id)}
            href={`/${bar}/artists/${String(artist.id)}/cassettes`}
            className="group flex items-center justify-between border-b border-zinc-700 py-4 text-white transition-colors hover:bg-white/5"
          >
            <span className="truncate text-sm text-white group-hover:text-red-400">{artist.name}</span>
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
