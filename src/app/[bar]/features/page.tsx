import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BAR_VALUES, serializeBigInt } from "@/lib/utils";
import { auth } from "@/lib/auth";

type Params = Promise<{ bar: string }>;

export default async function FeaturesPage({ params }: { params: Params }) {
  const { bar } = await params;
  const session = await auth();
  if (!session) redirect("/login");
  const barValue = BAR_VALUES[bar];

  const features = await prisma.feature.findMany({
    where: { bar: barValue },
    orderBy: { number: "asc" },
    include: { _count: { select: { featureItems: true } } },
  });

  const serialized = serializeBigInt(features);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Features</h1>
        <Link
          href={`/${bar}/features/new`}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          新規作成
        </Link>
      </div>

      {serialized.length === 0 ? (
        <p className="text-gray-500">フィーチャーがありません。</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {serialized.map((feature) => (
            <Link
              key={String(feature.id)}
              href={`/${bar}/features/${feature.id}`}
              className="block rounded-lg border border-zinc-700 p-4 transition hover:border-zinc-500"
            >
              {feature.externalThumbnail && (
                <img
                  src={feature.externalThumbnail}
                  alt={feature.name ?? ""}
                  className="mb-3 h-40 w-full rounded object-cover"
                />
              )}
              <h3 className="font-medium text-white">
                {feature.name ?? "Untitled"}
                <span className="ml-2 text-sm text-zinc-400">
                  ({feature._count.featureItems} items)
                </span>
              </h3>
              {feature.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {feature.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
