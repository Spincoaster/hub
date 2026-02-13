import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BAR_VALUES } from "@/lib/utils";

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ bar: string; id: string }>;
}) {
  const { bar, id } = await params;
  const session = await auth();

  const barFilter =
    bar === "ebisu"
      ? { bar: BAR_VALUES.ebisu }
      : bar === "shinjuku"
        ? { bar: { not: BAR_VALUES.ebisu } }
        : {};

  const artist = await prisma.artist.findUnique({
    where: { id: BigInt(id) },
    include: {
      records: { include: { owner: true }, where: barFilter },
      tracks: { include: { album: true } },
      albums: true,
    },
  });

  if (!artist) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{artist.name}</h1>
        {session && (
          <Link
            href={`/${bar}/artists/${Number(artist.id)}/edit`}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Edit
          </Link>
        )}
      </div>

      <dl className="mb-6 grid grid-cols-2 gap-2 text-sm">
        <dt className="font-medium text-gray-600">Phonetic Name</dt>
        <dd>{artist.phoneticName || "-"}</dd>
        <dt className="font-medium text-gray-600">Furigana</dt>
        <dd>{artist.furigana || "-"}</dd>
      </dl>

      {artist.records.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">Records</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-zinc-700 text-left text-sm text-zinc-400">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Owner</th>
                <th className="px-4 py-2">Location</th>
              </tr>
            </thead>
            <tbody>
              {artist.records.map((record) => (
                <tr
                  key={Number(record.id)}
                  className="group border-b border-zinc-800 hover:bg-white/5"
                >
                  <td className="px-4 py-2">
                    <Link
                      href={`/${bar}/records/${Number(record.id)}/edit`}
                      className="text-white group-hover:text-red-400 hover:underline"
                    >
                      {record.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-sm text-zinc-400 group-hover:text-red-400">
                    {record.owner?.name || "-"}
                  </td>
                  <td className="px-4 py-2 text-sm text-zinc-400 group-hover:text-red-400">
                    {record.location || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {artist.albums.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">Albums</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-zinc-700 text-left text-sm text-zinc-400">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Phonetic Name</th>
              </tr>
            </thead>
            <tbody>
              {artist.albums.map((album) => (
                <tr
                  key={Number(album.id)}
                  className="group border-b border-zinc-800 hover:bg-white/5"
                >
                  <td className="px-4 py-2">
                    <Link
                      href={`/${bar}/albums/${Number(album.id)}/edit`}
                      className="text-white group-hover:text-red-400 hover:underline"
                    >
                      {album.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-sm text-zinc-400 group-hover:text-red-400">
                    {album.phoneticName || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {artist.tracks.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">Tracks</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-zinc-700 text-left text-sm text-zinc-400">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Album</th>
                <th className="px-4 py-2">Number</th>
              </tr>
            </thead>
            <tbody>
              {artist.tracks.map((track) => (
                <tr
                  key={Number(track.id)}
                  className="group border-b border-zinc-800 hover:bg-white/5"
                >
                  <td className="px-4 py-2">
                    <Link
                      href={`/${bar}/tracks/${Number(track.id)}/edit`}
                      className="text-white group-hover:text-red-400 hover:underline"
                    >
                      {track.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-sm text-zinc-400 group-hover:text-red-400">
                    {track.album?.name || "-"}
                  </td>
                  <td className="px-4 py-2 text-sm text-zinc-400 group-hover:text-red-400">
                    {track.number ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
