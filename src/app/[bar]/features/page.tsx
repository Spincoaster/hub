import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";
import { auth } from "@/lib/auth";

type Params = Promise<{ bar: string }>;

export default async function FeaturesPage({ params }: { params: Params }) {
  const { bar } = await params;
  const session = await auth();

  const features = await prisma.feature.findMany({
    orderBy: { number: "asc" },
  });

  const grouped: Record<string, typeof features> = {};
  for (const feature of features) {
    const cat = feature.category ?? "uncategorized";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(feature);
  }

  const serialized = serializeBigInt(grouped);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Features</h1>
        {session && (
          <Link
            href={`/${bar}/features/new`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            新規作成
          </Link>
        )}
      </div>

      {Object.keys(serialized).length === 0 ? (
        <p className="text-gray-500">フィーチャーがありません。</p>
      ) : (
        Object.entries(serialized).map(([category, items]) => (
          <section key={category} className="mb-8">
            <h2 className="mb-4 border-b border-gray-200 pb-2 text-lg font-semibold text-gray-700 capitalize">
              {category}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((feature) => (
                <Link
                  key={String(feature.id)}
                  href={`/${bar}/features/${feature.id}`}
                  className="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  {feature.externalThumbnail && (
                    <img
                      src={feature.externalThumbnail}
                      alt={feature.name ?? ""}
                      className="mb-3 h-40 w-full rounded object-cover"
                    />
                  )}
                  <h3 className="font-medium text-gray-900">
                    {feature.name ?? "Untitled"}
                  </h3>
                  {feature.description && (
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                      {feature.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
