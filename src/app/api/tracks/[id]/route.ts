import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt, BAR_VALUES } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const track = await prisma.track.findUnique({
    where: { id: BigInt(id) },
    include: { artist: true, album: true },
  });

  if (!track) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(serializeBigInt(track));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // TODO: requireAuth()
  const { id } = await params;
  const body = await request.json();
  const track = await prisma.track.update({
    where: { id: BigInt(id) },
    data: {
      name: body.name,
      phoneticName: body.phoneticName,
      furigana: body.furigana,
      number: body.number,
      bar: body.bar !== undefined ? (BAR_VALUES[body.bar] ?? body.bar) : undefined,
      artistId: body.artistId ? BigInt(body.artistId) : undefined,
      albumId: body.albumId ? BigInt(body.albumId) : undefined,
    },
  });
  return NextResponse.json(serializeBigInt(track));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // TODO: requireAuth()
  const { id } = await params;
  await prisma.track.delete({ where: { id: BigInt(id) } });
  return NextResponse.json({ success: true });
}
