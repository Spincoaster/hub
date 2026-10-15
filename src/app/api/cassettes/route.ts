import { auth } from "@/lib/auth";
import { parseCassetteInput, cassetteWriteError } from "@/lib/cassette-input";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt, BAR_VALUES, buildPrefixFilter } from "@/lib/utils";
import {
  getSortedAdminCassetteIds,
  parseAdminListSort,
} from "@/lib/admin-list-sort";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const bar = searchParams.get("bar");
  if (bar !== "kagurazaka") return NextResponse.json({ data: [], total: 0, page: 1, limit: 50 });
  const hasPrefix = searchParams.get("has_prefix");
  const ownerId = searchParams.get("owner_id");
  const query = searchParams.get("query");
  const sort = parseAdminListSort(searchParams.get("sort"));
  const barValue = bar && BAR_VALUES[bar] !== undefined ? BAR_VALUES[bar] : undefined;
  if (ownerId && !/^\d+$/.test(ownerId)) return NextResponse.json({ error: "Invalid owner" }, { status: 400 });
  const parsedOwnerId = ownerId ? BigInt(ownerId) : undefined;
  const artistId = searchParams.get("artistId");
  if (artistId && !/^\d+$/.test(artistId)) return NextResponse.json({ error: "Invalid artist" }, { status: 400 });
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
        { phoneticName: { contains: term, mode: "insensitive" } },
        { furigana: { contains: term, mode: "insensitive" } },
        { sideAFirstTrack: { contains: term, mode: "insensitive" } },
        { sideBFirstTrack: { contains: term, mode: "insensitive" } },
        { artist: { name: { contains: term, mode: "insensitive" } } },
      ],
    }));
  }

  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "500", 10);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 500) return NextResponse.json({ error: "Invalid pagination" }, { status: 400 });
  const skip = (page - 1) * limit;

  if (sort) {
    const [cassetteIds, total] = await Promise.all([
      getSortedAdminCassetteIds({
        barValue,
        hasPrefix,
        ownerId: parsedOwnerId,
        artistId: parsedArtistId,
        query,
        sort,
        take: limit,
        skip,
      }),
      prisma.cassette.count({ where }),
    ]);

    const cassettes =
      cassetteIds.length === 0
        ? []
        : await prisma.cassette.findMany({
            where: { id: { in: cassetteIds } },
            include: {
              owner: true,
              artist: true,
              rankingAdjustment: true,
              _count: { select: { likes: true } },
            },
          });

    const cassetteById = new Map(cassettes.map((cassette) => [cassette.id.toString(), cassette]));
    const sortedCassettes = cassetteIds.flatMap((id) => {
      const cassette = cassetteById.get(id.toString());
      return cassette ? [cassette] : [];
    });

    return NextResponse.json(serializeBigInt({ data: sortedCassettes, total, page, limit }));
  }

  const [cassettes, total] = await Promise.all([
    prisma.cassette.findMany({
      where,
      include: {
        owner: true,
        artist: true,
        rankingAdjustment: true,
        _count: { select: { likes: true } },
      },
      orderBy: [{ artist: { name: "asc" } }, { name: "asc" }, { id: "asc" }],
      take: limit,
      skip,
    }),
    prisma.cassette.count({ where }),
  ]);

  return NextResponse.json(serializeBigInt({ data: cassettes, total, page, limit }));
}


export async function POST(request: NextRequest) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { data, scoreDelta } = parseCassetteInput(await request.json(), true);
    const cassette = await prisma.$transaction(async (tx) => {
      const item = await tx.cassette.create({ data: { ...data, name: data.name!, location: data.location!, number: data.number!, bar: 2 } });
      if (scoreDelta) await tx.rankingAdjustment.create({ data: { cassetteId: item.id, scoreDelta } });
      return item;
    });
    return NextResponse.json(serializeBigInt(cassette), { status: 201 });
  } catch (error) {
    const failure = cassetteWriteError(error);
    if (failure) return NextResponse.json({ error: failure.error }, { status: failure.status });
    throw error;
  }
}
