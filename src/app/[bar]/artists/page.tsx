import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BAR_VALUES, buildPrefixFilter } from "@/lib/utils";
import InitialLetterPagination from "@/components/InitialLetterPagination";
import DeleteButton from "@/components/DeleteButton";

export default async function ArtistsPage({
  params,
  searchParams,
}: {
  params: Promise<{ bar: string }>;
  searchParams: Promise<{ has_prefix?: string }>;
}) {
  const { bar } = await params;
  const { has_prefix: hasPrefix } = await searchParams;
  const session = await auth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (bar === "ebisu") {
    where.records = { some: { bar: BAR_VALUES.ebisu } };
  } else if (bar === "shinjuku") {
    where.NOT = {
      AND: [
        { records: { some: {} } },
        { records: { every: { bar: BAR_VALUES.ebisu } } },
      ],
    };
  }

  if (hasPrefix) {
    Object.assign(where, buildPrefixFilter(hasPrefix));
  }

  const artists = await prisma.artist.findMany({
    where,
    orderBy: { name: "asc" },
    take: 300,
  });

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Artists</h1>
        {session && (
          <Link
            href={`/${bar}/artists/new`}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            New Artist
          </Link>
        )}
      </div>

      <InitialLetterPagination
        basePath={`/${bar}/artists`}
        currentPrefix={hasPrefix}
      />

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-zinc-700 text-left text-sm text-zinc-400">
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Phonetic Name</th>
            {session && <th className="px-4 py-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {artists.map((artist) => (
            <tr key={Number(artist.id)} className="group border-b border-zinc-800 hover:bg-white/5">
              <td className="px-4 py-2">
                <Link
                  href={`/${bar}/artists/${Number(artist.id)}`}
                  className="text-white group-hover:text-red-400 hover:underline"
                >
                  {artist.name}
                </Link>
              </td>
              <td className="px-4 py-2 text-sm text-zinc-400 group-hover:text-red-400">
                {artist.phoneticName}
              </td>
              {session && (
                <td className="flex gap-2 px-4 py-2">
                  <Link
                    href={`/${bar}/artists/${Number(artist.id)}/edit`}
                    className="text-sm text-zinc-400 hover:text-white"
                  >
                    Edit
                  </Link>
                  <DeleteButton
                    apiPath={`/api/artists/${Number(artist.id)}`}
                  />
                </td>
              )}
            </tr>
          ))}
          {artists.length === 0 && (
            <tr>
              <td
                colSpan={session ? 3 : 2}
                className="px-4 py-8 text-center text-zinc-500"
              >
                No artists found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
