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

  const albums = await prisma.album.findMany({
    where,
    include: { artist: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(serializeBigInt(albums));
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
