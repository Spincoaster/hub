import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt, buildPrefixFilter } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const hasPrefix = searchParams.get("has_prefix");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  if (hasPrefix) {
    Object.assign(where, buildPrefixFilter(hasPrefix));
  }

  const tracks = await prisma.track.findMany({
    where,
    include: { artist: true, album: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(serializeBigInt(tracks));
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
      artistId: body.artistId ? BigInt(body.artistId) : null,
      albumId: body.albumId ? BigInt(body.albumId) : null,
    },
  });
  return NextResponse.json(serializeBigInt(track), { status: 201 });
}
