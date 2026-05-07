import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt, BAR_VALUES, buildPrefixFilter } from "@/lib/utils";
import {
  getSortedAdminRecordIds,
  parseAdminListSort,
} from "@/lib/admin-list-sort";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const bar = searchParams.get("bar");
  const hasPrefix = searchParams.get("has_prefix");
  const ownerId = searchParams.get("owner_id");
  const query = searchParams.get("query");
  const sort = parseAdminListSort(searchParams.get("sort"));
  const barValue = bar && BAR_VALUES[bar] !== undefined ? BAR_VALUES[bar] : undefined;
  const parsedOwnerId = ownerId ? BigInt(ownerId) : undefined;
  const artistId = searchParams.get("artistId");
  const parsedArtistId = artistId ? BigInt(artistId) : undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (barValue !== undefined) {
    where.bar = barValue;
  }

  if (hasPrefix) {
    Object.assign(where, buildPrefixFilter(hasPrefix));
  }

  if (parsedOwnerId !== undefined) {
    where.ownerId = parsedOwnerId;
  }

  if (parsedArtistId !== undefined) {
    where.artistId = parsedArtistId;
  }

  if (query) {
    const terms = query.split(/\s+/).filter(Boolean);
    where.AND = terms.map((term: string) => ({
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { artist: { name: { contains: term, mode: "insensitive" } } },
      ],
    }));
  }

  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "500", 10);
  const skip = (page - 1) * limit;

  if (sort) {
    const [recordIds, total] = await Promise.all([
      getSortedAdminRecordIds({
        barValue,
        hasPrefix,
        ownerId: parsedOwnerId,
        artistId: parsedArtistId,
        query,
        sort,
        take: limit,
        skip,
      }),
      prisma.record.count({ where }),
    ]);

    const records =
      recordIds.length === 0
        ? []
        : await prisma.record.findMany({
            where: { id: { in: recordIds } },
            include: {
              owner: true,
              artist: true,
              rankingAdjustment: true,
              _count: { select: { likes: true } },
            },
          });

    const recordById = new Map(records.map((record) => [record.id.toString(), record]));
    const sortedRecords = recordIds.flatMap((id) => {
      const record = recordById.get(id.toString());
      return record ? [record] : [];
    });

    return NextResponse.json(serializeBigInt({ data: sortedRecords, total, page, limit }));
  }

  const [records, total] = await Promise.all([
    prisma.record.findMany({
      where,
      include: {
        owner: true,
        artist: true,
        rankingAdjustment: true,
        _count: { select: { likes: true } },
      },
      orderBy: { artist: { name: "asc" } },
      take: limit,
      skip,
    }),
    prisma.record.count({ where }),
  ]);

  return NextResponse.json(serializeBigInt({ data: records, total, page, limit }));
}

export async function POST(request: NextRequest) {
  // TODO: requireAuth()
  const body = await request.json();
  const record = await prisma.record.create({
    data: {
      name: body.name,
      phoneticName: body.phoneticName,
      furigana: body.furigana,
      location: body.location,
      number: body.number,
      comment: body.comment,
      bar: body.bar !== undefined ? BAR_VALUES[body.bar] ?? body.bar : null,
      artistId: body.artistId ? BigInt(body.artistId) : null,
      ownerId: body.ownerId ? BigInt(body.ownerId) : null,
    },
  });
  return NextResponse.json(serializeBigInt(record), { status: 201 });
}
