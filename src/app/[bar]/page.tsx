import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BAR_VALUES, serializeBigInt } from "@/lib/utils";

export const dynamic = "force-dynamic";

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function RecordRow({
  artist,
  album,
  number,
  href,
}: {
  artist: string;
  album: string;
  number: number | null;
  href: string;
}) {
  return (
    <Link href={href} className="group flex items-center border-b border-zinc-800 py-3 transition-colors hover:bg-zinc-900/50">
      <span className="w-2/5 truncate text-sm">{artist}</span>
      <span className="w-2/5 truncate text-sm">{album}</span>
      <span className="flex w-1/5 items-center justify-end gap-1 text-sm text-zinc-400">
        {number != null && (
          <>
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span>{String(number).padStart(3, "0")}</span>
          </>
        )}
        <svg className="ml-2 h-4 w-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      </span>
    </Link>
  );
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
      include: { artist: true },
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
      include: { artist: true },
    }),
  ]);

  const records = serializeBigInt(topRecords);
  const tracks = serializeBigInt(topTracks);
  const featureList = serializeBigInt(features);
  const arrivals = serializeBigInt(newArrivals);

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
              href={`/${bar}/records`}
              className="flex items-center justify-between rounded-full border border-zinc-600 px-6 py-2.5 text-sm font-medium transition-colors hover:border-white"
            >
              <span>View All Record</span>
              <svg className="ml-4 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8l4 4-4 4M8 12h8" />
              </svg>
            </Link>
            <Link
              href={`/${bar}/tracks`}
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
        {records.map((record) => (
          <RecordRow
            key={record.id}
            artist={record.artist?.name ?? "—"}
            album={record.name ?? "—"}
            number={record.number}
            href={`/${bar}/records`}
          />
        ))}
      </section>

      {/* Hi-Res TOP 100 */}
      <section className="mb-16">
        <SectionHeader
          title="Hi-Res TOP 100"
          viewAllHref={`/${bar}/tracks`}
          viewAllLabel="View All Hi-res"
        />
        <TableHeader />
        {tracks.map((track) => (
          <RecordRow
            key={track.id}
            artist={track.artist?.name ?? "—"}
            album={track.album?.name ?? "—"}
            number={track.number}
            href={`/${bar}/tracks`}
          />
        ))}
      </section>

      {/* Recommend */}
      <section className="mb-16">
        <SectionHeader
          title="Recommend"
          viewAllHref={`/${bar}/features`}
          viewAllLabel="View All"
        />
        <TableHeader />
        {featureList.map((feature) => (
          <RecordRow
            key={feature.id}
            artist={feature.name ?? "—"}
            album={feature.description ?? "—"}
            number={feature.number}
            href={`/${bar}/features`}
          />
        ))}
      </section>

      {/* New Arrival */}
      <section className="mb-16">
        <SectionHeader
          title="New Arrival"
          viewAllHref={`/${bar}/new-arrivals`}
          viewAllLabel="View All"
        />
        <TableHeader />
        {arrivals.map((record) => (
          <RecordRow
            key={record.id}
            artist={record.artist?.name ?? "—"}
            album={record.name ?? "—"}
            number={record.number}
            href={`/${bar}/records`}
          />
        ))}
      </section>
    </div>
  );
}
