import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BAR_VALUES, serializeBigInt } from "@/lib/utils";
import { RecordList } from "@/components/RecordList";
import { getSessionId } from "@/lib/session";
import { auth } from "@/lib/auth";
import { RightUpArrow } from "@/components/icons/RightUpArrow";

export const dynamic = "force-dynamic";

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function SectionHeader({
  title,
  viewAllHref,
  viewAllLabel,
}: {
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="text-3xl font-bold">{title}</h2>
      <Link
        href={viewAllHref}
        className="text-sm text-white underline transition-colors hover:text-white"
      >
        [ {viewAllLabel} &gt; ]
      </Link>
    </div>
  );
}

function TableHeader({ columns }: { columns?: string[] }) {
  const cols = columns ?? ["Title", "Artist"];
  return (
    <div className="hidden items-stretch border-b border-zinc-600 text-xs font-semibold text-white md:flex">
      <span className="flex w-4/5 items-stretch">
        {cols.map((col, i) => (
          <span key={col} className={`flex w-1/2 items-center py-2 ${i === 0 ? "pl-2 pr-4" : "pl-4"}`}>{col}</span>
        )).reduce<React.ReactNode[]>((acc, el, i) => {
          if (i > 0) acc.push(<span key={`sep-${i}`} className="w-px self-stretch bg-zinc-600" />);
          acc.push(el);
          return acc;
        }, [])}
      </span>
      <span className="w-1/5" />
    </div>
  );
}

export default async function BarPage({
  params,
}: {
  params: Promise<{ bar: string }>;
}) {
  const { bar } = await params;
  const barValue = BAR_VALUES[bar];

  // Records with at least 1 like, ordered by like count desc
  const topRecordLikes = await prisma.like.groupBy({
    by: ["recordId"],
    where: {
      recordId: { not: null },
      record: { bar: barValue },
    },
    _count: { recordId: true },
    orderBy: { _count: { recordId: "desc" } },
    take: 5,
  });

  const topRecordIds = topRecordLikes
    .map((l) => l.recordId)
    .filter((id): id is bigint => id !== null);

  const topRecords =
    topRecordIds.length > 0
      ? await prisma.record.findMany({
          where: { id: { in: topRecordIds } },
          include: { artist: true, owner: true },
        })
      : [];

  // Tracks with at least 1 like, ordered by like count desc
  const topTrackLikes = await prisma.like.groupBy({
    by: ["trackId"],
    where: { trackId: { not: null } },
    _count: { trackId: true },
    orderBy: { _count: { trackId: "desc" } },
    take: 5,
  });

  const topTrackIds = topTrackLikes
    .map((l) => l.trackId)
    .filter((id): id is bigint => id !== null);

  const topTracks =
    topTrackIds.length > 0
      ? await prisma.track.findMany({
          where: { id: { in: topTrackIds } },
          include: { artist: true, album: true },
        })
      : [];

  const barFeatures = await prisma.feature.findMany({
    where: { bar: barValue },
    orderBy: { number: "asc" },
    include: {
      featureItems: { orderBy: { number: "asc" } },
    },
  });

  // Build likeCounts map
  const likeCounts: Record<string, number> = {};
  for (const l of topRecordLikes) {
    if (l.recordId) likeCounts[String(l.recordId)] = l._count.recordId;
  }
  for (const l of topTrackLikes) {
    if (l.trackId) likeCounts[String(l.trackId)] = l._count.trackId;
  }

  // Resolve feature items polymorphically
  const featuresWithItems = await Promise.all(
    barFeatures.map(async (feature) => {
      const resolvedItems = await Promise.all(
        feature.featureItems.map(async (item) => {
          let itemData: Record<string, unknown> | null = null;
          if (item.itemId) {
            if (item.itemType === "Record") {
              itemData = (await prisma.record.findUnique({
                where: { id: BigInt(item.itemId) },
                include: { artist: true, owner: true },
              })) as unknown as Record<string, unknown> | null;
            } else if (item.itemType === "Track") {
              itemData = (await prisma.track.findUnique({
                where: { id: BigInt(item.itemId) },
                include: { artist: true, album: true },
              })) as unknown as Record<string, unknown> | null;
            }
          }
          return { ...item, itemData, itemType: item.itemType };
        }),
      );
      return { ...feature, resolvedItems };
    }),
  );

  // Collect all record/track IDs from features for like counts
  const featureRecordIds: bigint[] = [];
  const featureTrackIds: bigint[] = [];
  for (const f of featuresWithItems) {
    for (const item of f.resolvedItems) {
      if (item.itemData && item.itemId) {
        if (item.itemType === "Record") featureRecordIds.push(BigInt(item.itemId));
        if (item.itemType === "Track") featureTrackIds.push(BigInt(item.itemId));
      }
    }
  }

  // Get like counts for feature items
  if (featureRecordIds.length > 0) {
    const featureRecordLikes = await prisma.like.groupBy({
      by: ["recordId"],
      where: { recordId: { in: featureRecordIds } },
      _count: { recordId: true },
    });
    for (const l of featureRecordLikes) {
      if (l.recordId) likeCounts[String(l.recordId)] = l._count.recordId;
    }
  }
  if (featureTrackIds.length > 0) {
    const featureTrackLikes = await prisma.like.groupBy({
      by: ["trackId"],
      where: { trackId: { in: featureTrackIds } },
      _count: { trackId: true },
    });
    for (const l of featureTrackLikes) {
      if (l.trackId) likeCounts[String(l.trackId)] = l._count.trackId;
    }
  }

  // Build likeMap for current session
  const sessionId = await getSessionId();
  const allRecordIds = [...topRecordIds, ...featureRecordIds];
  const allTrackIds = [...topTrackIds, ...featureTrackIds];

  let likeMap: Record<string, string> = {};
  if (sessionId) {
    const orConditions = [];
    if (allRecordIds.length > 0)
      orConditions.push({ recordId: { in: allRecordIds } });
    if (allTrackIds.length > 0)
      orConditions.push({ trackId: { in: allTrackIds } });

    if (orConditions.length > 0) {
      const likes = await prisma.like.findMany({
        where: { sessionId, OR: orConditions },
      });
      for (const like of likes) {
        const itemId = like.recordId ?? like.trackId;
        if (itemId) likeMap[String(itemId)] = String(like.id);
      }
    }
  }

  const records = serializeBigInt(topRecords);
  const tracks = serializeBigInt(topTracks);
  const serializedFeatures = serializeBigInt(featuresWithItems);

  // Sort by like count (groupBy order)
  const recordOrder = new Map(topRecordIds.map((id, i) => [String(id), i]));
  const trackOrder = new Map(topTrackIds.map((id, i) => [String(id), i]));

  const recordItems = records
    .sort(
      (a, b) =>
        (recordOrder.get(String(a.id)) ?? 999) -
        (recordOrder.get(String(b.id)) ?? 999),
    )
    .map((r) => ({
      id: String(r.id),
      name: r.name ?? "—",
      artistName: r.artist?.name ?? "—",
      albumName: r.name ?? "—",
      number: r.number,
      type: "Record" as const,
      ownerName: r.owner?.name ?? undefined,
      location: r.location ?? undefined,
    }));

  const trackItems = tracks
    .sort(
      (a, b) =>
        (trackOrder.get(String(a.id)) ?? 999) -
        (trackOrder.get(String(b.id)) ?? 999),
    )
    .map((t) => ({
      id: String(t.id),
      name: t.name ?? "—",
      artistName: t.artist?.name ?? "—",
      albumName: t.album?.name ?? "—",
      number: t.number,
      type: "Hi-Res" as const,
    }));

  // Build items for each feature section
  const featureSections = serializedFeatures.map((f: Record<string, unknown>) => {
    const resolvedItems = f.resolvedItems as Array<{
      itemType: string | null;
      itemData: {
        id?: string;
        name?: string;
        artist?: { name?: string } | null;
        album?: { name?: string } | null;
        owner?: { name?: string } | null;
        location?: string;
        number?: number | null;
      } | null;
    }>;
    const items = resolvedItems
      .filter((item) => item.itemData)
      .map((item) => ({
        id: String(item.itemData!.id),
        name: item.itemData!.name ?? "—",
        artistName: item.itemData!.artist?.name ?? "—",
        albumName:
          item.itemType === "Track"
            ? (item.itemData!.album?.name ?? "—")
            : (item.itemData!.name ?? "—"),
        number: item.itemData!.number ?? null,
        type: (item.itemType === "Track" ? "Hi-Res" : "Record") as "Record" | "Hi-Res",
        ownerName: item.itemType === "Record" ? (item.itemData!.owner?.name ?? undefined) : undefined,
        location: item.itemType === "Record" ? ((item.itemData as { location?: string }).location ?? undefined) : undefined,
      }));
    return { id: f.id as string, name: f.name as string, items };
  });

  const session = await auth();

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto mb-16 max-w-5xl px-4 md:mb-24">
        <div className="flex flex-col gap-4 md:flex-row md:gap-0 md:items-center md:justify-between">
          <h1 className="text-6xl font-normal tracking-normal md:text-8xl">
            MUSIC LIST
          </h1>
          <span className="text-2xl font-normal tracking-wide md:text-3xl">
            {capitalize(bar)}
          </span>
        </div>

        <div className="mt-12 flex flex-col gap-10 md:flex-row md:gap-6 md:items-start md:justify-between">
          <div className="space-y-2 text-base leading-relaxed text-white">
            <div className="font-semibold leading-relaxed">
              <p>There&apos;s a 900yen cover charge per person,</p>
              <p>and the following are complimentary.</p>
            </div>
            <p className="mt-4 text-white">
              当店は900円のカバーチャージをいただいております。以下はサービスです。
            </p>
            <ul className="mt-6 text-white">
              <li className="flex"><span className="w-1/2">・<span className="font-semibold">Snacks on the table</span></span><span className="w-1/2">テーブルスナック</span></li>
              <li className="flex"><span className="w-1/2">・<span className="font-semibold">1 Song Request</span></span><span className="w-1/2">1曲リクエスト</span></li>
            </ul>
          </div>

          <div className="flex flex-col gap-6">
            <a
              href={`https://menu.spincoaster.com/${bar}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-full h-16 border border-zinc-600 pl-10 pr-0 text-sm font-medium"
            >
              <span>Drink Menu</span>
              <span className="relative ml-16 flex h-16 w-16 shrink-0 items-center justify-center">
                <img src="/annulus.svg" alt="" className="absolute inset-0 h-full w-full" />
                <RightUpArrow className="relative h-2.5 w-2.5" />
              </span>
            </a>
            <Link
              href={`/${bar}/records/artists`}
              className="flex items-center justify-between rounded-full h-16 border border-zinc-600 pl-10 pr-0 text-sm font-medium"
            >
              <span>View All Record</span>
              <span className="relative ml-16 flex h-16 w-16 shrink-0 items-center justify-center">
                <img src="/annulus.svg" alt="" className="absolute inset-0 h-full w-full" />
                <RightUpArrow className="relative h-2.5 w-2.5" />
              </span>
            </Link>
            <Link
              href={`/${bar}/tracks/artists`}
              className="flex items-center justify-between rounded-full h-16 border border-zinc-600 pl-10 pr-0 text-sm font-medium"
            >
              <span>View All Hi-Res</span>
              <span className="relative ml-16 flex h-16 w-16 shrink-0 items-center justify-center">
                <img src="/annulus.svg" alt="" className="absolute inset-0 h-full w-full" />
                <RightUpArrow className="relative h-2.5 w-2.5" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <hr className="mb-12 border-zinc-600" />

      {/* Record TOP 100 */}
      <section className="mx-auto mb-16 max-w-5xl px-4">
        <SectionHeader
          title="Record TOP 100"
          viewAllHref={`/${bar}/records/top100`}
          viewAllLabel="View All"
        />
        <TableHeader />
        <RecordList items={recordItems} likeMap={likeMap} likeCounts={likeCounts} />
      </section>

      <hr className="mb-12 border-zinc-600" />

      {/* Hi-Res TOP 100 */}
      <section className="mx-auto mb-16 max-w-5xl px-4">
        <SectionHeader
          title="Hi-Res TOP 100"
          viewAllHref={`/${bar}/tracks/top100`}
          viewAllLabel="View All"
        />
        <TableHeader columns={["Title", "Album / Artist"]} />
        <RecordList items={trackItems} likeMap={likeMap} likeCounts={likeCounts} />
      </section>

      {/* Dynamic Feature Sections */}
      {featureSections.map((section, idx) => (
        <section key={idx} className="mb-16">
          <hr className="mb-12 border-zinc-600" />
          <div className="mx-auto max-w-5xl px-4">
            <div className="mb-2 flex items-end justify-between">
              <h2 className="text-2xl font-bold">{section.name}</h2>
              {session && (
                <Link
                  href={`/${bar}/features/${section.id}/edit`}
                  className="text-sm text-white underline transition-colors hover:text-white"
                >
                  [ edit &gt; ]
                </Link>
              )}
            </div>
            <TableHeader />
            <RecordList items={section.items} likeMap={likeMap} likeCounts={likeCounts} />
          </div>
        </section>
      ))}
    </div>
  );
}
