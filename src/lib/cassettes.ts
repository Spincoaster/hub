import { getAdjustedCassetteLikeCounts, getTopCassetteRanking } from "@/lib/ranking-adjustments";
import { prisma } from "@/lib/prisma";
import { getSessionId } from "@/lib/session";
import { recordListItemKey } from "@/lib/record-list-keys";

export type CassetteListData = {
  id: bigint | string; name: string; number: number; location: string;
  sideAFirstTrack: string | null; sideBFirstTrack: string | null; comment: string | null;
  artist: { name: string | null } | null; owner: { name: string | null } | null;
};

export function cassetteListItem(item: CassetteListData) {
  return { id: String(item.id), name: item.name, artistName: item.artist?.name ?? "—", albumName: "", number: item.number, location: item.location, ownerName: item.owner?.name ?? undefined, type: "Cassette" as const, sideAFirstTrack: item.sideAFirstTrack ?? undefined, sideBFirstTrack: item.sideBFirstTrack ?? undefined, comment: item.comment ?? undefined };
}

export async function cassetteLikes(ids: bigint[]) {
  const likeCounts: Record<string, number> = {};
  const likeMap: Record<string, string> = {};
  if (!ids.length) return { likeCounts, likeMap };
  const sessionId = await getSessionId();
  const [counts, likes] = await Promise.all([
    getAdjustedCassetteLikeCounts(ids),
    sessionId ? prisma.like.findMany({ where: { sessionId, cassetteId: { in: ids } } }) : [],
  ]);
  for (const [id, count] of Object.entries(counts)) likeCounts[recordListItemKey(id, "Cassette")] = count;
  for (const row of likes) if (row.cassetteId) likeMap[recordListItemKey(row.cassetteId, "Cassette")] = String(row.id);
  return { likeCounts, likeMap };
}

export async function popularCassettes(bar: number, take: number) {
  const ranking = await getTopCassetteRanking(bar, take);
  const ids = ranking.map((row) => row.itemId);
  const cassettes = ids.length ? await prisma.cassette.findMany({
    where: { id: { in: ids } },
    include: { artist: true, owner: true },
  }) : [];
  const byId = new Map(cassettes.map((item) => [item.id, item]));
  return {
    items: ids.flatMap((id) => { const item = byId.get(id); return item ? [cassetteListItem(item)] : []; }),
    ...await cassetteLikes(ids),
  };
}
