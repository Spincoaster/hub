import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { buildPrefixFilter } from "@/lib/utils";
import InitialLetterPagination from "@/components/InitialLetterPagination";
import DeleteButton from "@/components/DeleteButton";
import { SEARCH } from "@/lib/labels";

export default async function TracksPage({
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

  if (hasPrefix) {
    Object.assign(where, buildPrefixFilter(hasPrefix));
  }

  const tracks = await prisma.track.findMany({
    where,
    include: { artist: true, album: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tracks</h1>
        {session && (
          <Link
            href={`/${bar}/tracks/new`}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            New Track
          </Link>
        )}
      </div>

      <p className="mb-2 text-sm text-white">{SEARCH.artistLabel}</p>
      <InitialLetterPagination
        basePath={`/${bar}/tracks`}
        currentPrefix={hasPrefix}
      />

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-zinc-700 text-left text-sm text-zinc-400">
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Artist</th>
            <th className="px-4 py-2">Album</th>
            <th className="px-4 py-2">Number</th>
            {session && <th className="px-4 py-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {tracks.map((track) => (
            <tr key={Number(track.id)} className="group border-b border-zinc-800 hover:bg-white/5">
              <td className="px-4 py-2 group-hover:text-red-400">{track.name}</td>
              <td className="px-4 py-2 text-sm text-zinc-400 group-hover:text-red-400">
                {track.artist ? (
                  <Link
                    href={`/${bar}/artists/${Number(track.artist.id)}`}
                    className="text-white group-hover:text-red-400 hover:underline"
                  >
                    {track.artist.name}
                  </Link>
                ) : (
                  "-"
                )}
              </td>
              <td className="px-4 py-2 text-sm text-zinc-400 group-hover:text-red-400">
                {track.album?.name || "-"}
              </td>
              <td className="px-4 py-2 text-sm text-zinc-400 group-hover:text-red-400">
                {track.number ?? "-"}
              </td>
              {session && (
                <td className="flex gap-2 px-4 py-2">
                  <Link
                    href={`/${bar}/tracks/${Number(track.id)}/edit`}
                    className="text-sm text-zinc-400 hover:text-white"
                  >
                    Edit
                  </Link>
                  <DeleteButton
                    apiPath={`/api/tracks/${Number(track.id)}`}
                  />
                </td>
              )}
            </tr>
          ))}
          {tracks.length === 0 && (
            <tr>
              <td
                colSpan={session ? 5 : 4}
                className="px-4 py-8 text-center text-zinc-500"
              >
                No tracks found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
