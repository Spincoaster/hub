import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BAR_VALUES, serializeBigInt } from "@/lib/utils";
import { RecordList } from "@/components/RecordList";

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
    <div className="mb-2 flex items-end justify-between">
      <h2 className="text-2xl font-bold">{title}</h2>
      <Link
        href={viewAllHref}
        className="text-sm text-zinc-400 underline transition-colors hover:text-white"
      >
        [ {viewAllLabel} &gt; ]
      </Link>
    </div>
  );
}

function TableHeader() {
  return (
    <div className="flex border-b border-zinc-700 py-2 text-xs font-semibold text-zinc-400">
      <span className="w-2/5">Artists</span>
      <span className="w-2/5">Albums</span>
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

  const [topRecords, topTracks, features, newArrivals] = await Promise.all([
    prisma.record.findMany({
      where: { bar: barValue },
      orderBy: { number: "desc" },
      take: 5,
      include: { artist: true, owner: true },
    }),
    prisma.track.findMany({
      orderBy: { number: "desc" },
      take: 5,
      include: { artist: true, album: true },
    }),
    prisma.feature.findMany({
      orderBy: { number: "desc" },
      take: 5,
      include: {
        featureItems: {
          take: 1,
        },
      },
    }),
    prisma.record.findMany({
      where: { bar: barValue },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { artist: true, owner: true },
    }),
  ]);

  const records = serializeBigInt(topRecords);
  const tracks = serializeBigInt(topTracks);
  const featureList = serializeBigInt(features);
  const arrivals = serializeBigInt(newArrivals);

  const recordItems = records.map((r) => ({
    id: String(r.id),
    name: r.name ?? "—",
    artistName: r.artist?.name ?? "—",
    albumName: r.name ?? "—",
    number: r.number,
    type: "Record" as const,
    ownerName: r.owner?.name ?? undefined,
    location: r.location ?? undefined,
  }));

  const trackItems = tracks.map((t) => ({
    id: String(t.id),
    name: t.name ?? "—",
    artistName: t.artist?.name ?? "—",
    albumName: t.album?.name ?? "—",
    number: t.number,
    type: "Hi-Res" as const,
  }));

  const arrivalItems = arrivals.map((r) => ({
    id: String(r.id),
    name: r.name ?? "—",
    artistName: r.artist?.name ?? "—",
    albumName: r.name ?? "—",
    number: r.number,
    type: "Record" as const,
    ownerName: r.owner?.name ?? undefined,
    location: r.location ?? undefined,
  }));

  return (
    <div>
      {/* Hero */}
      <section className="mb-16">
        <div className="flex items-start justify-between">
          <h1 className="text-5xl font-bold tracking-wider md:text-6xl">
            MUSIC LIST
          </h1>
          <span className="text-2xl font-light tracking-wide md:text-3xl">
            {capitalize(bar)}
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="text-sm leading-relaxed text-zinc-300">
            <p>There&apos;s a 900yen cover charge per person,</p>
            <p>and the following are complimentary.</p>
            <p className="mt-2 text-zinc-400">
              当店は900円のカバーチャージをいただいております。以下はサービスです。
            </p>
            <ul className="mt-3 text-zinc-300">
              <li>・Snacks on the table　テーブルスナック</li>
              <li>・1 Song Request　1曲リクエスト</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href={`/${bar}/records/artists`}
              className="flex items-center justify-between rounded-full border border-zinc-600 px-6 py-2.5 text-sm font-medium transition-colors hover:border-white"
            >
              <span>View All Record</span>
              <svg className="ml-4 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8l4 4-4 4M8 12h8" />
              </svg>
            </Link>
            <Link
              href={`/${bar}/tracks/artists`}
              className="flex items-center justify-between rounded-full border border-zinc-600 px-6 py-2.5 text-sm font-medium transition-colors hover:border-white"
            >
              <span>View All Hi-Res</span>
              <svg className="ml-4 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8l4 4-4 4M8 12h8" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Record TOP 100 */}
      <section className="mb-16">
        <SectionHeader
          title="Record TOP 100"
          viewAllHref={`/${bar}/records`}
          viewAllLabel="View All Record"
        />
        <TableHeader />
        <RecordList items={recordItems} />
      </section>

      {/* Hi-Res TOP 100 */}
      <section className="mb-16">
        <SectionHeader
          title="Hi-Res TOP 100"
          viewAllHref={`/${bar}/tracks`}
          viewAllLabel="View All Hi-res"
        />
        <TableHeader />
        <RecordList items={trackItems} />
      </section>

      {/* Recommend */}
      <section className="mb-16">
        <SectionHeader
          title="Recommend"
          viewAllHref={`/${bar}/features`}
          viewAllLabel="View All"
        />
        <TableHeader />
        <RecordList
          items={featureList.map((f) => ({
            id: String(f.id),
            name: f.name ?? "—",
            artistName: f.name ?? "—",
            albumName: f.description ?? "—",
            number: f.number,
            type: "Record" as const,
          }))}
        />
      </section>

      {/* New Arrival */}
      <section className="mb-16">
        <SectionHeader
          title="New Arrival"
          viewAllHref={`/${bar}/new-arrivals`}
          viewAllLabel="View All"
        />
        <TableHeader />
        <RecordList items={arrivalItems} />
      </section>
    </div>
  );
}
