import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import DeleteButton from "@/components/DeleteButton";

export default async function OwnersPage({
  params,
}: {
  params: Promise<{ bar: string }>;
}) {
  const { bar } = await params;
  const session = await auth();

  const owners = await prisma.owner.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4">
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
          <tr className="border-b bg-gray-50 text-left text-sm text-gray-600">
            <th className="px-4 py-2">Name</th>
            {session && <th className="px-4 py-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {owners.map((owner) => (
            <tr key={Number(owner.id)} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">
                <Link
                  href={`/${bar}/records?owner_id=${Number(owner.id)}`}
                  className="text-blue-600 hover:underline"
                >
                  {owner.name}
                </Link>
              </td>
              {session && (
                <td className="flex gap-2 px-4 py-2">
                  <Link
                    href={`/${bar}/owners/${Number(owner.id)}/edit`}
                    className="text-sm text-blue-600 hover:text-blue-800"
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
                className="px-4 py-8 text-center text-gray-500"
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
