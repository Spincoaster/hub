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

  if (hasPrefix) {
    Object.assign(where, buildPrefixFilter(hasPrefix));
  }

  const artists = await prisma.artist.findMany({
    where,
    orderBy: { name: "asc" },
    take: 300,
  });

  return NextResponse.json(serializeBigInt(artists));
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
