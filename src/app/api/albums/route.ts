import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt, BAR_VALUES, buildPrefixFilter } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const hasPrefix = searchParams.get("has_prefix");
  const bar = searchParams.get("bar");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  const query = searchParams.get("query");
  const artistId = searchParams.get("artistId");

  if (bar && BAR_VALUES[bar] !== undefined) {
    where.tracks = { some: { bar: BAR_VALUES[bar] } };
  }

  if (artistId) {
    where.artistId = BigInt(artistId);
  }

  if (hasPrefix) {
    Object.assign(where, buildPrefixFilter(hasPrefix));
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
  const limit = parseInt(searchParams.get("limit") ?? "300", 10);
  const skip = (page - 1) * limit;

  const [albums, total] = await Promise.all([
    prisma.album.findMany({
      where,
      include: { artist: true, _count: { select: { tracks: true } } },
      orderBy: { name: "asc" },
      take: limit,
      skip,
    }),
    prisma.album.count({ where }),
  ]);

  return NextResponse.json(serializeBigInt({ data: albums, total, page, limit }));
}

export async function POST(request: NextRequest) {
  // TODO: requireAuth()
  const body = await request.json();
  const album = await prisma.album.create({
    data: {
      name: body.name,
      phoneticName: body.phoneticName,
      furigana: body.furigana,
      artistId: body.artistId ? BigInt(body.artistId) : null,
    },
  });
  return NextResponse.json(serializeBigInt(album), { status: 201 });
}
