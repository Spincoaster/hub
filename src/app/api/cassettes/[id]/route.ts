import { parseCassetteInput, cassetteWriteError } from "@/lib/cassette-input";
import { deleteCassettes } from "@/lib/delete-cassettes";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { serializeBigInt } from "@/lib/utils";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const cassette = await prisma.cassette.findUnique({ where: { id: BigInt(id) }, include: { artist: true, owner: true, rankingAdjustment: true } });
  if (!cassette) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(serializeBigInt(cassette));
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const { data, scoreDelta } = parseCassetteInput(await request.json());
    const updated = await prisma.$transaction(async (tx) => {
      const cassette = await tx.cassette.update({ where: { id: BigInt(id) }, data });
      if (scoreDelta === 0) {
        await tx.rankingAdjustment.deleteMany({ where: { cassetteId: cassette.id } });
      } else if (scoreDelta !== undefined) {
        await tx.rankingAdjustment.upsert({ where: { cassetteId: cassette.id }, create: { cassetteId: cassette.id, scoreDelta }, update: { scoreDelta } });
      }
      return cassette;
    });
    return NextResponse.json(serializeBigInt(updated));
  } catch (error) {
    const failure = cassetteWriteError(error);
    if (failure) return NextResponse.json({ error: failure.error }, { status: failure.status });
    throw error;
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await auth())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const result = await prisma.$transaction((tx) => deleteCassettes(tx, [BigInt(id)]));
  if (!result.count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
