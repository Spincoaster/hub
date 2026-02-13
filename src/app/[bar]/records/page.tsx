import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BAR_VALUES, buildPrefixFilter } from "@/lib/utils";
import InitialLetterPagination from "@/components/InitialLetterPagination";

export default async function RecordsPage({
  params,
  searchParams,
}: {
  params: Promise<{ bar: string }>;
  searchParams: Promise<{ has_prefix?: string; owner_id?: string }>;
}) {
  const { bar } = await params;
  const { has_prefix: hasPrefix, owner_id: ownerId } = await searchParams;
  const session = await auth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (bar && BAR_VALUES[bar] !== undefined) {
    where.bar = BAR_VALUES[bar];
  }

  if (hasPrefix) {
    Object.assign(where, buildPrefixFilter(hasPrefix));
  }

  if (ownerId) {
    where.ownerId = BigInt(ownerId);
  }

  const records = await prisma.record.findMany({
    where,
    include: { owner: true, artist: true },
    orderBy: { artist: { name: "asc" } },
    take: 500,
  });

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="mb-6 flex items-start justify-between">
        <h1 className="text-5xl font-light tracking-tight md:text-7xl">
          All Record List
        </h1>
        {session && (
          <Link
            href={`/${bar}/records/new`}
            className="mt-2 shrink-0 rounded bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
          >
            New Record
          </Link>
        )}
      </div>

      <div className="mb-8">
        <InitialLetterPagination
          basePath={`/${bar}/records`}
          currentPrefix={hasPrefix}
        />
      </div>

      <div className="flex flex-col">
        {records.map((record) => (
          <Link
            key={Number(record.id)}
            href={
              session
                ? `/${bar}/records/${Number(record.id)}/edit`
                : `/${bar}/artists/${Number(record.artist?.id)}`
            }
            className="group flex items-center justify-between border-b border-zinc-700 py-4 transition-colors hover:bg-white/5"
          >
            <span className="text-white group-hover:text-red-400">
              {record.artist?.name || record.name}
            </span>
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
        {records.length === 0 && (
          <p className="py-8 text-center text-zinc-500">No records found.</p>
        )}
      </div>
    </div>
  );
}
