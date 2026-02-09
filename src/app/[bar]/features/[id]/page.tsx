import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";
import { auth } from "@/lib/auth";

type Params = Promise<{ bar: string; id: string }>;

export default async function FeatureDetailPage({
  params,
}: {
  params: Params;
}) {
  const { bar, id } = await params;
  const session = await auth();

  const feature = await prisma.feature.findUnique({
    where: { id: BigInt(id) },
    include: {
      featureItems: { orderBy: { number: "asc" } },
    },
  });

  if (!feature) {
    notFound();
  }

  const itemsWithData = await Promise.all(
    feature.featureItems.map(async (item) => {
      let itemData: Record<string, unknown> | null = null;
      if (item.itemId) {
        if (item.itemType === "Track") {
          itemData = (await prisma.track.findUnique({
            where: { id: BigInt(item.itemId) },
            include: { artist: true, album: true },
          })) as unknown as Record<string, unknown> | null;
        } else if (item.itemType === "Record") {
          itemData = (await prisma.record.findUnique({
            where: { id: BigInt(item.itemId) },
            include: { artist: true, owner: true },
          })) as unknown as Record<string, unknown> | null;
        }
      }
      return { ...item, itemData };
    })
  );

  const serialized = serializeBigInt({
    ...feature,
    featureItems: itemsWithData,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4">
        <Link
          href={`/${bar}/features`}
          className="text-sm text-blue-600 hover:underline"
        >
          &larr; Features 一覧
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {serialized.name ?? "Untitled"}
        </h1>
        {session && (
          <Link
            href={`/${bar}/features/${id}/edit`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            編集
          </Link>
        )}
      </div>

      {serialized.externalThumbnail && (
        <img
          src={serialized.externalThumbnail}
          alt={serialized.name ?? ""}
          className="mb-6 h-64 w-full rounded-lg object-cover"
        />
      )}

      {serialized.description && (
        <p className="mb-6 text-gray-700">{serialized.description}</p>
      )}

      {serialized.externalLink && (
        <a
          href={serialized.externalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline"
        >
          外部リンク
        </a>
      )}

      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm text-gray-500">
          カテゴリ: {serialized.category ?? "なし"}
        </span>
      </div>

      <h2 className="mb-4 text-xl font-semibold text-gray-800">アイテム</h2>

      {serialized.featureItems.length === 0 ? (
        <p className="text-gray-500">アイテムがありません。</p>
      ) : (
        <div className="space-y-4">
          {serialized.featureItems.map(
            (item: {
              id: string | bigint;
              number: number | null;
              itemType: string | null;
              comment: string | null;
              itemData: {
                name?: string;
                artist?: { name?: string } | null;
                album?: { name?: string } | null;
                owner?: { name?: string } | null;
              } | null;
            }) => (
              <div
                key={String(item.id)}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="mr-2 text-sm font-medium text-gray-400">
                      #{item.number}
                    </span>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {item.itemType}
                    </span>
                  </div>
                </div>
                {item.itemData && (
                  <div className="mt-2">
                    <p className="font-medium text-gray-900">
                      {item.itemData.name ?? ""}
                    </p>
                    {item.itemData.artist && (
                      <p className="text-sm text-gray-500">
                        Artist: {item.itemData.artist.name ?? ""}
                      </p>
                    )}
                    {item.itemType === "Track" && item.itemData.album && (
                      <p className="text-sm text-gray-500">
                        Album: {item.itemData.album.name ?? ""}
                      </p>
                    )}
                    {item.itemType === "Record" && item.itemData.owner && (
                      <p className="text-sm text-gray-500">
                        Owner: {item.itemData.owner.name ?? ""}
                      </p>
                    )}
                  </div>
                )}
                {item.comment && (
                  <p className="mt-2 text-sm text-gray-600 italic">
                    {item.comment}
                  </p>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
