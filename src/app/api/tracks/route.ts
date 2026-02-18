import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt, BAR_VALUES, buildPrefixFilter } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const hasPrefix = searchParams.get("has_prefix");
  const query = searchParams.get("query");
  const bar = searchParams.get("bar");
  const artistId = searchParams.get("artistId");
  const albumId = searchParams.get("albumId");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (bar && BAR_VALUES[bar] !== undefined) {
    where.bar = BAR_VALUES[bar];
  }
  if (artistId) {
    where.artistId = BigInt(artistId);
  }
  if (albumId) {
    where.albumId = BigInt(albumId);
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
  const limit = parseInt(searchParams.get("limit") ?? "500", 10);
  const skip = (page - 1) * limit;

  const [tracks, total] = await Promise.all([
    prisma.track.findMany({
      where,
      include: { artist: true, album: true, _count: { select: { likes: true } } },
      orderBy: { name: "asc" },
      take: limit,
      skip,
    }),
    prisma.track.count({ where }),
  ]);

  return NextResponse.json(serializeBigInt({ data: tracks, total, page, limit }));
}

export async function POST(request: NextRequest) {
  // TODO: requireAuth()
  const body = await request.json();
  const track = await prisma.track.create({
    data: {
      name: body.name,
      phoneticName: body.phoneticName,
      furigana: body.furigana,
      number: body.number,
      bar: body.bar !== undefined ? (BAR_VALUES[body.bar] ?? body.bar) : null,
      artistId: body.artistId ? BigInt(body.artistId) : null,
      albumId: body.albumId ? BigInt(body.albumId) : null,
    },
  });
  return NextResponse.json(serializeBigInt(track), { status: 201 });
}
