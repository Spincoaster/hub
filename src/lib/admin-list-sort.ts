import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type AdminListSort = "likes_desc" | "adjusted_likes_desc";

type SortedIdRow = {
  id: bigint;
};

export function parseAdminListSort(value: string | null): AdminListSort | null {
  if (value === "likes_desc" || value === "adjusted_likes_desc") return value;
  return null;
}

function searchTerms(query: string | null): string[] {
  return (query ?? "").split(/\s+/).filter(Boolean);
}

function whereSql(conditions: Prisma.Sql[]): Prisma.Sql {
  if (conditions.length === 0) return Prisma.empty;
  return Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;
}

function recordPrefixCondition(hasPrefix: string | null): Prisma.Sql | null {
  if (!hasPrefix) return null;

  if (/^[a-zA-Z]$/.test(hasPrefix)) {
    return Prisma.sql`r.phonetic_name LIKE ${`${hasPrefix.toLowerCase()}%`}`;
  }

  if (hasPrefix === "#") {
    return Prisma.sql`r.phonetic_name < 'a' AND r.phonetic_name <> ''`;
  }

  return Prisma.sql`r.furigana LIKE ${`${hasPrefix}%`}`;
}

function trackPrefixCondition(hasPrefix: string | null): Prisma.Sql | null {
  if (!hasPrefix) return null;

  if (/^[a-zA-Z]$/.test(hasPrefix)) {
    return Prisma.sql`t.phonetic_name LIKE ${`${hasPrefix.toLowerCase()}%`}`;
  }

  if (hasPrefix === "#") {
    return Prisma.sql`t.phonetic_name < 'a' AND t.phonetic_name <> ''`;
  }

  return Prisma.sql`t.furigana LIKE ${`${hasPrefix}%`}`;
}

function recordConditions(params: {
  barValue?: number;
  hasPrefix: string | null;
  ownerId?: bigint;
  artistId?: bigint;
  query: string | null;
}): Prisma.Sql[] {
  const conditions: Prisma.Sql[] = [];

  if (params.barValue !== undefined) conditions.push(Prisma.sql`r.bar = ${params.barValue}`);
  if (params.ownerId !== undefined) conditions.push(Prisma.sql`r.owner_id = ${params.ownerId}`);
  if (params.artistId !== undefined) conditions.push(Prisma.sql`r.artist_id = ${params.artistId}`);

  const prefixCondition = recordPrefixCondition(params.hasPrefix);
  if (prefixCondition) conditions.push(prefixCondition);

  for (const term of searchTerms(params.query)) {
    const pattern = `%${term}%`;
    conditions.push(Prisma.sql`(r.name ILIKE ${pattern} OR a.name ILIKE ${pattern})`);
  }

  return conditions;
}

function trackConditions(params: {
  barValue?: number;
  hasPrefix: string | null;
  artistId?: bigint;
  albumId?: bigint;
  query: string | null;
}): Prisma.Sql[] {
  const conditions: Prisma.Sql[] = [];

  if (params.barValue !== undefined) conditions.push(Prisma.sql`t.bar = ${params.barValue}`);
  if (params.artistId !== undefined) conditions.push(Prisma.sql`t.artist_id = ${params.artistId}`);
  if (params.albumId !== undefined) conditions.push(Prisma.sql`t.album_id = ${params.albumId}`);

  const prefixCondition = trackPrefixCondition(params.hasPrefix);
  if (prefixCondition) conditions.push(prefixCondition);

  for (const term of searchTerms(params.query)) {
    const pattern = `%${term}%`;
    conditions.push(Prisma.sql`(t.name ILIKE ${pattern} OR a.name ILIKE ${pattern})`);
  }

  return conditions;
}

export async function getSortedAdminRecordIds(params: {
  barValue?: number;
  hasPrefix: string | null;
  ownerId?: bigint;
  artistId?: bigint;
  query: string | null;
  sort: AdminListSort;
  take: number;
  skip: number;
}): Promise<bigint[]> {
  const orderBy =
    params.sort === "adjusted_likes_desc"
      ? Prisma.sql`
          GREATEST(COALESCE(l.like_count, 0) + COALESCE(ra.score_delta, 0), 0) DESC,
          COALESCE(l.like_count, 0) DESC,
          a.name ASC NULLS LAST,
          r.name ASC NULLS LAST,
          r.id ASC
        `
      : Prisma.sql`
          COALESCE(l.like_count, 0) DESC,
          GREATEST(COALESCE(l.like_count, 0) + COALESCE(ra.score_delta, 0), 0) DESC,
          a.name ASC NULLS LAST,
          r.name ASC NULLS LAST,
          r.id ASC
        `;

  const rows = await prisma.$queryRaw<SortedIdRow[]>`
    SELECT r.id
    FROM records r
    LEFT JOIN artists a ON a.id = r.artist_id
    LEFT JOIN (
      SELECT record_id, count(*)::int AS like_count
      FROM likes
      WHERE record_id IS NOT NULL
      GROUP BY record_id
    ) l ON l.record_id = r.id
    LEFT JOIN ranking_adjustments ra ON ra.record_id = r.id
    ${whereSql(recordConditions(params))}
    ORDER BY ${orderBy}
    LIMIT ${params.take}
    OFFSET ${params.skip}
  `;

  return rows.map((row) => row.id);
}

export async function getSortedAdminTrackIds(params: {
  barValue?: number;
  hasPrefix: string | null;
  artistId?: bigint;
  albumId?: bigint;
  query: string | null;
  sort: AdminListSort;
  take: number;
  skip: number;
}): Promise<bigint[]> {
  const orderBy =
    params.sort === "adjusted_likes_desc"
      ? Prisma.sql`
          GREATEST(COALESCE(l.like_count, 0) + COALESCE(ra.score_delta, 0), 0) DESC,
          COALESCE(l.like_count, 0) DESC,
          a.name ASC NULLS LAST,
          al.name ASC NULLS LAST,
          t.name ASC NULLS LAST,
          t.id ASC
        `
      : Prisma.sql`
          COALESCE(l.like_count, 0) DESC,
          GREATEST(COALESCE(l.like_count, 0) + COALESCE(ra.score_delta, 0), 0) DESC,
          a.name ASC NULLS LAST,
          al.name ASC NULLS LAST,
          t.name ASC NULLS LAST,
          t.id ASC
        `;

  const rows = await prisma.$queryRaw<SortedIdRow[]>`
    SELECT t.id
    FROM tracks t
    LEFT JOIN artists a ON a.id = t.artist_id
    LEFT JOIN albums al ON al.id = t.album_id
    LEFT JOIN (
      SELECT track_id, count(*)::int AS like_count
      FROM likes
      WHERE track_id IS NOT NULL
      GROUP BY track_id
    ) l ON l.track_id = t.id
    LEFT JOIN ranking_adjustments ra ON ra.track_id = t.id
    ${whereSql(trackConditions(params))}
    ORDER BY ${orderBy}
    LIMIT ${params.take}
    OFFSET ${params.skip}
  `;

  return rows.map((row) => row.id);
}
