import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const owner = await prisma.owner.findUnique({
    where: { id: BigInt(id) },
    include: { records: { include: { artist: true } } },
  });

  if (!owner) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(serializeBigInt(owner));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // TODO: requireAuth()
  const { id } = await params;
  const body = await request.json();
  const owner = await prisma.owner.update({
    where: { id: BigInt(id) },
    data: { name: body.name },
  });
  return NextResponse.json(serializeBigInt(owner));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // TODO: requireAuth()
  const { id } = await params;
  await prisma.owner.delete({ where: { id: BigInt(id) } });
  return NextResponse.json({ success: true });
}
