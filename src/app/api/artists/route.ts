import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt, BAR_VALUES, buildPrefixFilter } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const bar = searchParams.get("bar");
  const hasPrefix = searchParams.get("has_prefix");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (bar && BAR_VALUES[bar] !== undefined) {
    where.records = { some: { bar: BAR_VALUES[bar] } };
  }

  const hasTracks = searchParams.get("hasTracks");
  const hasTracksBar = searchParams.get("hasTracksBar");
  if (hasTracks === "true") {
    if (hasTracksBar && BAR_VALUES[hasTracksBar] !== undefined) {
      where.tracks = { some: { bar: BAR_VALUES[hasTracksBar] } };
    } else {
      where.tracks = { some: {} };
    }
  }

  const query = searchParams.get("query");

  if (hasPrefix) {
    Object.assign(where, buildPrefixFilter(hasPrefix));
  }

  if (query) {
    const terms = query.split(/\s+/).filter(Boolean);
    where.AND = terms.map((term: string) => ({
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { phoneticName: { contains: term, mode: "insensitive" } },
        { furigana: { contains: term, mode: "insensitive" } },
      ],
    }));
  }

  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "300", 10);
  const skip = (page - 1) * limit;

  const [artists, total] = await Promise.all([
    prisma.artist.findMany({
      where,
      include: { _count: { select: { records: true, albums: true, tracks: true } } },
      orderBy: { name: "asc" },
      take: limit,
      skip,
    }),
    prisma.artist.count({ where }),
  ]);

  return NextResponse.json(serializeBigInt({ data: artists, total, page, limit }));
}

export async function POST(request: NextRequest) {
  // TODO: requireAuth()
  const body = await request.json();
  const artist = await prisma.artist.create({
    data: {
      name: body.name,
      phoneticName: body.phoneticName,
      furigana: body.furigana,
    },
  });
  return NextResponse.json(serializeBigInt(artist), { status: 201 });
}
