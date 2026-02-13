import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BAR_VALUES, serializeBigInt } from "@/lib/utils";
import Link from "next/link";
import { RecordList } from "@/components/RecordList";
import { BackLink } from "@/components/BackLink";
import { getSessionId } from "@/lib/session";

export default async function ArtistRecordsPage({
  params,
}: {
  params: Promise<{ bar: string; id: string }>;
}) {
  const { bar, id } = await params;

  const barFilter =
    bar === "ebisu"
      ? { bar: BAR_VALUES.ebisu }
      : bar === "shinjuku"
        ? { bar: { not: BAR_VALUES.ebisu } }
        : {};

  const artist = await prisma.artist.findUnique({
    where: { id: BigInt(id) },
    include: {
      records: {
        include: { owner: true },
        where: barFilter,
        orderBy: { name: "asc" },
      },
    },
  });

  if (!artist) notFound();

  const records = serializeBigInt(artist.records);

  const items = records.map((r) => ({
    id: String(r.id),
    name: r.name ?? "—",
    artistName: artist.name ?? "—",
    albumName: r.name ?? "—",
    number: r.number,
    type: "Record" as const,
    ownerName: r.owner?.name ?? undefined,
    location: r.location ?? undefined,
  }));

  const recordIds = records.map((r) => BigInt(r.id));

  // Like counts
  const likeCounts: Record<string, number> = {};
  if (recordIds.length > 0) {
    const counts = await prisma.like.groupBy({
      by: ["recordId"],
      where: { recordId: { in: recordIds } },
      _count: { recordId: true },
    });
    for (const c of counts) {
      if (c.recordId) likeCounts[String(c.recordId)] = c._count.recordId;
    }
  }

  // Session likeMap
  const sessionId = await getSessionId();
  let likeMap: Record<string, string> = {};
  if (sessionId && recordIds.length > 0) {
    const likes = await prisma.like.findMany({
      where: { sessionId, recordId: { in: recordIds } },
    });
    for (const like of likes) {
      if (like.recordId) likeMap[String(like.recordId)] = String(like.id);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="-mt-8 mb-6">
        <nav className="flex min-w-0 items-center gap-1 text-sm text-zinc-400">
          <Link href={`/${bar}`} className="shrink-0 hover:text-white">Top</Link>
          <span className="shrink-0">/</span>
          <BackLink label="All Record List" href={`/${bar}/records/artists`} className="truncate" />
        </nav>
        <h1 className="mt-2 text-4xl font-normal tracking-tight">
          {artist.name}
        </h1>
        <p className="mt-2 text-sm text-white">[ Records ]</p>
      </div>

      <div className="flex flex-col">
        <RecordList items={items} likeMap={likeMap} likeCounts={likeCounts} singleColumn />
        {items.length === 0 && (
          <p className="py-8 text-center text-white">No records found.</p>
        )}
      </div>
    </div>
  );
}
