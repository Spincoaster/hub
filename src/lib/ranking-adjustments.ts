import { prisma } from "@/lib/prisma";

export type RankingResult = {
  itemId: bigint;
  likeCount: number;
  scoreDelta: number;
  score: number;
};

type RankingRow = {
  itemId: bigint;
  likeCount: number | bigint;
  scoreDelta: number | bigint;
  score: number | bigint;
};

function toNumber(value: number | bigint | null | undefined): number {
  if (typeof value === "bigint") return Number(value);
  return value ?? 0;
}

function normalizeRows(rows: RankingRow[]): RankingResult[] {
  return rows.map((row) => ({
    itemId: row.itemId,
    likeCount: toNumber(row.likeCount),
    scoreDelta: toNumber(row.scoreDelta),
    score: toNumber(row.score),
  }));
}

function uniqueBigInts(ids: bigint[]): bigint[] {
  return Array.from(new Map(ids.map((id) => [id.toString(), id])).values());
}

export function applyScoreDelta(likeCount: number, scoreDelta: number): number {
  return Math.max(likeCount + scoreDelta, 0);
}

export async function getTopRecordRanking(
  barValue: number,
  take: number,
): Promise<RankingResult[]> {
  const rows = await prisma.$queryRaw<RankingRow[]>`
    SELECT
      r.id AS "itemId",
      COALESCE(l.like_count, 0)::int AS "likeCount",
      COALESCE(ra.score_delta, 0)::int AS "scoreDelta",
      GREATEST(COALESCE(l.like_count, 0) + COALESCE(ra.score_delta, 0), 0)::int AS "score"
    FROM records r
    LEFT JOIN (
      SELECT record_id, count(*)::int AS like_count
      FROM likes
      WHERE record_id IS NOT NULL
      GROUP BY record_id
    ) l ON l.record_id = r.id
    LEFT JOIN ranking_adjustments ra ON ra.record_id = r.id
    WHERE r.bar = ${barValue}
      AND GREATEST(COALESCE(l.like_count, 0) + COALESCE(ra.score_delta, 0), 0) > 0
    ORDER BY "score" DESC, "likeCount" DESC, r.id ASC
    LIMIT ${take}
  `;

  return normalizeRows(rows);
}

export async function getTopTrackRanking(take: number): Promise<RankingResult[]> {
  const rows = await prisma.$queryRaw<RankingRow[]>`
    SELECT
      t.id AS "itemId",
      COALESCE(l.like_count, 0)::int AS "likeCount",
      COALESCE(ra.score_delta, 0)::int AS "scoreDelta",
      GREATEST(COALESCE(l.like_count, 0) + COALESCE(ra.score_delta, 0), 0)::int AS "score"
    FROM tracks t
    LEFT JOIN (
      SELECT track_id, count(*)::int AS like_count
      FROM likes
      WHERE track_id IS NOT NULL
      GROUP BY track_id
    ) l ON l.track_id = t.id
    LEFT JOIN ranking_adjustments ra ON ra.track_id = t.id
    WHERE GREATEST(COALESCE(l.like_count, 0) + COALESCE(ra.score_delta, 0), 0) > 0
    ORDER BY "score" DESC, "likeCount" DESC, t.id ASC
    LIMIT ${take}
  `;

  return normalizeRows(rows);
}

export async function getAdjustedRecordLikeCounts(
  recordIds: bigint[],
): Promise<Record<string, number>> {
  const ids = uniqueBigInts(recordIds);
  if (ids.length === 0) return {};

  const [likeCounts, adjustments] = await Promise.all([
    prisma.like.groupBy({
      by: ["recordId"],
      where: { recordId: { in: ids } },
      _count: { recordId: true },
    }),
    prisma.rankingAdjustment.findMany({
      where: { recordId: { in: ids } },
      select: { recordId: true, scoreDelta: true },
    }),
  ]);

  const rawCounts = new Map<string, number>();
  for (const count of likeCounts) {
    if (count.recordId) rawCounts.set(String(count.recordId), count._count.recordId);
  }

  const scoreDeltas = new Map<string, number>();
  for (const adjustment of adjustments) {
    if (adjustment.recordId) {
      scoreDeltas.set(String(adjustment.recordId), adjustment.scoreDelta);
    }
  }

  const counts: Record<string, number> = {};
  for (const id of ids) {
    const key = String(id);
    counts[key] = applyScoreDelta(rawCounts.get(key) ?? 0, scoreDeltas.get(key) ?? 0);
  }
  return counts;
}

export async function getAdjustedLikeCount({
  recordId,
  trackId,
}: {
  recordId?: bigint | null;
  trackId?: bigint | null;
}): Promise<number> {
  if (recordId) {
    const counts = await getAdjustedRecordLikeCounts([recordId]);
    return counts[String(recordId)] ?? 0;
  }

  if (trackId) {
    const counts = await getAdjustedTrackLikeCounts([trackId]);
    return counts[String(trackId)] ?? 0;
  }

  return 0;
}

export async function getAdjustedTrackLikeCounts(
  trackIds: bigint[],
): Promise<Record<string, number>> {
  const ids = uniqueBigInts(trackIds);
  if (ids.length === 0) return {};

  const [likeCounts, adjustments] = await Promise.all([
    prisma.like.groupBy({
      by: ["trackId"],
      where: { trackId: { in: ids } },
      _count: { trackId: true },
    }),
    prisma.rankingAdjustment.findMany({
      where: { trackId: { in: ids } },
      select: { trackId: true, scoreDelta: true },
    }),
  ]);

  const rawCounts = new Map<string, number>();
  for (const count of likeCounts) {
    if (count.trackId) rawCounts.set(String(count.trackId), count._count.trackId);
  }

  const scoreDeltas = new Map<string, number>();
  for (const adjustment of adjustments) {
    if (adjustment.trackId) {
      scoreDeltas.set(String(adjustment.trackId), adjustment.scoreDelta);
    }
  }

  const counts: Record<string, number> = {};
  for (const id of ids) {
    const key = String(id);
    counts[key] = applyScoreDelta(rawCounts.get(key) ?? 0, scoreDeltas.get(key) ?? 0);
  }
  return counts;
}
