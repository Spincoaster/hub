import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BAR_VALUES, buildPrefixFilter } from "@/lib/utils";
import InitialLetterPagination from "@/components/InitialLetterPagination";
import DeleteButton from "@/components/DeleteButton";

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
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Records</h1>
        {session && (
          <Link
            href={`/${bar}/records/new`}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            New Record
          </Link>
        )}
      </div>

      <InitialLetterPagination
        basePath={`/${bar}/records`}
        currentPrefix={hasPrefix}
      />

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-sm text-gray-600">
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Artist</th>
            <th className="px-4 py-2">Owner</th>
            <th className="px-4 py-2">Location</th>
            <th className="px-4 py-2">Number</th>
            {session && <th className="px-4 py-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={Number(record.id)} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{record.name}</td>
              <td className="px-4 py-2 text-sm text-gray-600">
                {record.artist ? (
                  <Link
                    href={`/${bar}/artists/${Number(record.artist.id)}`}
                    className="text-blue-600 hover:underline"
                  >
                    {record.artist.name}
                  </Link>
                ) : (
                  "-"
                )}
              </td>
              <td className="px-4 py-2 text-sm text-gray-600">
                {record.owner?.name || "-"}
              </td>
              <td className="px-4 py-2 text-sm text-gray-600">
                {record.location || "-"}
              </td>
              <td className="px-4 py-2 text-sm text-gray-600">
                {record.number ?? "-"}
              </td>
              {session && (
                <td className="flex gap-2 px-4 py-2">
                  <Link
                    href={`/${bar}/records/${Number(record.id)}/edit`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </Link>
                  <DeleteButton
                    apiPath={`/api/records/${Number(record.id)}`}
                  />
                </td>
              )}
            </tr>
          ))}
          {records.length === 0 && (
            <tr>
              <td
                colSpan={session ? 6 : 5}
                className="px-4 py-8 text-center text-gray-500"
              >
                No records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
