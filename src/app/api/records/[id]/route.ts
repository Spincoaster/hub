import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt, BAR_VALUES } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await prisma.record.findUnique({
    where: { id: BigInt(id) },
    include: { owner: true, artist: true },
  });

  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(serializeBigInt(record));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // TODO: requireAuth()
  const { id } = await params;
  const body = await request.json();
  const record = await prisma.record.update({
    where: { id: BigInt(id) },
    data: {
      name: body.name,
      phoneticName: body.phoneticName,
      furigana: body.furigana,
      location: body.location,
      number: body.number,
      comment: body.comment,
      bar: body.bar !== undefined ? BAR_VALUES[body.bar] ?? body.bar : undefined,
      artistId: body.artistId ? BigInt(body.artistId) : undefined,
      ownerId: body.ownerId ? BigInt(body.ownerId) : undefined,
    },
  });
  return NextResponse.json(serializeBigInt(record));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // TODO: requireAuth()
  const { id } = await params;
  await prisma.record.delete({ where: { id: BigInt(id) } });
  return NextResponse.json({ success: true });
}
