import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { getSessionId } from "@/lib/session";
import { DeleteFeatureButton } from "@/components/admin/DeleteFeatureButton";
import { RecordList } from "@/components/RecordList";
import { PageRefresh } from "@/components/PageRefresh";

type Params = Promise<{ bar: string; id: string }>;

export const dynamic = "force-dynamic";

export default async function FeatureDetailPage({
  params,
}: {
  params: Params;
}) {
  const { bar, id } = await params;
  const session = await auth();
  if (!session) redirect("/login");

  const feature = await prisma.feature.findUnique({
    where: { id: BigInt(id) },
    include: {
      featureItems: { orderBy: { number: "asc" } },
    },
  });

  if (!feature) {
    notFound();
  }

  // Collect item IDs by type
  const recordIds: bigint[] = [];
  const trackIds: bigint[] = [];
  for (const item of feature.featureItems) {
    if (item.itemId) {
      if (item.itemType === "Record") recordIds.push(BigInt(item.itemId));
      if (item.itemType === "Track") trackIds.push(BigInt(item.itemId));
    }
  }

  // Batch fetch records, tracks, like counts, and session likes
  const allItemIds = [...recordIds, ...trackIds];
  const sessionId = await getSessionId();

  const [records, tracks, recordLikeCounts, trackLikeCounts, sessionLikes] =
    await Promise.all([
      recordIds.length > 0
        ? prisma.record.findMany({
            where: { id: { in: recordIds } },
            include: { artist: true, owner: true },
          })
        : Promise.resolve([]),
      trackIds.length > 0
        ? prisma.track.findMany({
            where: { id: { in: trackIds } },
            include: { artist: true, album: true },
          })
        : Promise.resolve([]),
      recordIds.length > 0
        ? prisma.like.groupBy({
            by: ["recordId"],
            where: { recordId: { in: recordIds } },
            _count: { recordId: true },
          })
        : Promise.resolve([]),
      trackIds.length > 0
        ? prisma.like.groupBy({
            by: ["trackId"],
            where: { trackId: { in: trackIds } },
            _count: { trackId: true },
          })
        : Promise.resolve([]),
      sessionId && allItemIds.length > 0
        ? prisma.like.findMany({
            where: {
              sessionId,
              OR: [
                ...(recordIds.length > 0
                  ? [{ recordId: { in: recordIds } }]
                  : []),
                ...(trackIds.length > 0
                  ? [{ trackId: { in: trackIds } }]
                  : []),
              ],
            },
          })
        : Promise.resolve([]),
    ]);

  // Build lookup maps
  const recordMap = new Map(records.map((r) => [String(r.id), r]));
  const trackMap = new Map(tracks.map((t) => [String(t.id), t]));

  // Build likeCounts
  const likeCounts: Record<string, number> = {};
  for (const l of recordLikeCounts) {
    if (l.recordId) likeCounts[String(l.recordId)] = l._count.recordId;
  }
  for (const l of trackLikeCounts) {
    if (l.trackId) likeCounts[String(l.trackId)] = l._count.trackId;
  }

  // Build likeMap
  const likeMap: Record<string, string> = {};
  for (const like of sessionLikes) {
    const itemId = like.recordId ?? like.trackId;
    if (itemId) likeMap[String(itemId)] = String(like.id);
  }

  // Build RecordList items
  const items = feature.featureItems
    .map((item) => {
      if (!item.itemId) return null;
      if (item.itemType === "Record") {
        const r = recordMap.get(String(item.itemId));
        if (!r) return null;
        return {
          id: String(r.id),
          name: r.name ?? "—",
          artistName: r.artist?.name ?? "—",
          albumName: r.name ?? "—",
          number: r.number,
          type: "Record" as const,
          ownerName: r.owner?.name ?? undefined,
          location: r.location ?? undefined,
        };
      }
      if (item.itemType === "Track") {
        const t = trackMap.get(String(item.itemId));
        if (!t) return null;
        return {
          id: String(t.id),
          name: t.name ?? "—",
          artistName: t.artist?.name ?? "—",
          albumName: t.album?.name ?? "—",
          number: t.number,
          type: "Hi-Res" as const,
        };
      }
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const serialized = serializeBigInt(feature);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageRefresh />
      <div className="mb-4">
        <Link
          href={`/${bar}/admin`}
          className="text-sm text-zinc-400 hover:text-white hover:underline"
        >
          &larr; Admin
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          {serialized.name ?? "Untitled"}
        </h1>
        <div className="flex gap-3">
          <Link
            href={`/${bar}/features/${id}/edit`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            編集
          </Link>
          <DeleteFeatureButton id={id} bar={bar} />
        </div>
      </div>

      <dl className="mb-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-zinc-500">番号</dt>
        <dd className="text-white">{serialized.number ?? "-"}</dd>
        <dt className="text-zinc-500">説明</dt>
        <dd className="text-zinc-300">{serialized.description || "-"}</dd>
      </dl>

      <h2 className="mb-4 text-xl font-semibold text-white">
        アイテム ({items.length})
      </h2>

      {items.length === 0 ? (
        <p className="text-zinc-500">アイテムがありません。</p>
      ) : (
        <>
          <div className="hidden items-stretch border-b border-zinc-600 text-xs font-semibold text-white md:flex">
            <span className="flex w-4/5 items-stretch">
              <span className="flex w-1/2 items-center py-2 pl-2 pr-4">Title</span>
              <span className="w-px self-stretch bg-zinc-600" />
              <span className="flex w-1/2 items-center py-2 pl-4">Artist</span>
            </span>
            <span className="w-1/5" />
          </div>
          <RecordList items={items} likeMap={likeMap} likeCounts={likeCounts} />
        </>
      )}
    </div>
  );
}
