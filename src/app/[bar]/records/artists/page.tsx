import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BAR_VALUES, buildPrefixFilter } from "@/lib/utils";
import InitialLetterPagination from "@/components/InitialLetterPagination";

export default async function RecordArtistsPage({
  params,
  searchParams,
}: {
  params: Promise<{ bar: string }>;
  searchParams: Promise<{ has_prefix?: string }>;
}) {
  const { bar } = await params;
  const { has_prefix: hasPrefix } = await searchParams;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    records: { some: { bar: BAR_VALUES[bar] } },
  };

  if (hasPrefix) {
    Object.assign(where, buildPrefixFilter(hasPrefix));
  }

  const artists = await prisma.artist.findMany({
    where,
    orderBy: { name: "asc" },
    take: 500,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-5xl font-light tracking-tight md:text-7xl">
          All Record List
        </h1>
      </div>

      <div className="mb-8">
        <InitialLetterPagination
          basePath={`/${bar}/records/artists`}
          currentPrefix={hasPrefix}
        />
      </div>

      <div className="flex flex-col">
        {artists.map((artist) => (
          <Link
            key={Number(artist.id)}
            href={`/${bar}/artists/${Number(artist.id)}`}
            className="group flex items-center justify-between border-b border-zinc-700 py-4 transition-colors hover:bg-white/5"
          >
            <span className="text-white">{artist.name}</span>
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
          <p className="py-8 text-center text-zinc-500">No artists found.</p>
        )}
      </div>
    </div>
  );
}
