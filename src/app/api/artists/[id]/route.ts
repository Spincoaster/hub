import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const artist = await prisma.artist.findUnique({
    where: { id: BigInt(id) },
    include: {
      albums: { include: { _count: { select: { tracks: true } } } },
      records: { include: { owner: true } },
      tracks: { include: { album: true } },
    },
  });

  if (!artist) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(serializeBigInt(artist));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // TODO: requireAuth()
  const { id } = await params;
  const body = await request.json();
  const artist = await prisma.artist.update({
    where: { id: BigInt(id) },
    data: {
      name: body.name,
      phoneticName: body.phoneticName,
      furigana: body.furigana,
    },
  });
  return NextResponse.json(serializeBigInt(artist));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // TODO: requireAuth()
  const { id } = await params;
  await prisma.artist.delete({ where: { id: BigInt(id) } });
  return NextResponse.json({ success: true });
}
