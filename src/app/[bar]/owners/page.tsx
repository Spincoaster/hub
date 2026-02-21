import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BAR_VALUES } from "@/lib/utils";
import DeleteButton from "@/components/DeleteButton";

export default async function OwnersPage({
  params,
}: {
  params: Promise<{ bar: string }>;
}) {
  const { bar } = await params;
  const session = await auth();

  const owners = await prisma.owner.findMany({
    where: { records: { some: { bar: BAR_VALUES[bar] } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Owners</h1>
        {session && (
          <Link
            href={`/${bar}/owners/new`}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            New Owner
          </Link>
        )}
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-zinc-700 text-left text-sm text-zinc-400">
            <th className="px-4 py-2">Name</th>
            {session && <th className="px-4 py-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {owners.map((owner) => (
            <tr key={Number(owner.id)} className="group border-b border-zinc-800 hover:bg-white/5">
              <td className="px-4 py-2">
                <Link
                  href={`/${bar}/records?owner_id=${Number(owner.id)}`}
                  className="text-white group-hover:text-red-400 hover:underline"
                >
                  {owner.name}
                </Link>
              </td>
              {session && (
                <td className="flex gap-2 px-4 py-2">
                  <Link
                    href={`/${bar}/owners/${Number(owner.id)}/edit`}
                    className="text-sm text-zinc-400 hover:text-white"
                  >
                    Edit
                  </Link>
                  <DeleteButton
                    apiPath={`/api/owners/${Number(owner.id)}`}
                  />
                </td>
              )}
            </tr>
          ))}
          {owners.length === 0 && (
            <tr>
              <td
                colSpan={session ? 2 : 1}
                className="px-4 py-8 text-center text-zinc-500"
              >
                No owners found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
