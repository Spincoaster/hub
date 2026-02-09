import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const album = await prisma.album.findUnique({
    where: { id: BigInt(id) },
    include: { artist: true, tracks: true },
  });

  if (!album) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(serializeBigInt(album));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // TODO: requireAuth()
  const { id } = await params;
  const body = await request.json();
  const album = await prisma.album.update({
    where: { id: BigInt(id) },
    data: {
      name: body.name,
      phoneticName: body.phoneticName,
      furigana: body.furigana,
      artistId: body.artistId ? BigInt(body.artistId) : undefined,
    },
  });
  return NextResponse.json(serializeBigInt(album));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // TODO: requireAuth()
  const { id } = await params;
  await prisma.album.delete({ where: { id: BigInt(id) } });
  return NextResponse.json({ success: true });
}
