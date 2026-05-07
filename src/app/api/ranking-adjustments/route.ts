import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

type ItemType = "Record" | "Track" | "Hi-Res";

function isItemType(value: unknown): value is ItemType {
  return value === "Record" || value === "Track" || value === "Hi-Res";
}

function isBigIntString(value: unknown): value is string {
  return typeof value === "string" && /^\d+$/.test(value);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const itemType = body.itemType;
  const itemId = body.itemId;
  const scoreDelta = Number(body.scoreDelta);

  if (!isItemType(itemType) || !isBigIntString(itemId) || !Number.isInteger(scoreDelta)) {
    return NextResponse.json(
      { error: "itemType, itemId, and integer scoreDelta are required" },
      { status: 400 },
    );
  }

  const id = BigInt(itemId);
  const isRecord = itemType === "Record";

  if (scoreDelta === 0) {
    await prisma.rankingAdjustment.deleteMany({
      where: isRecord ? { recordId: id } : { trackId: id },
    });
    return NextResponse.json({ scoreDelta: 0 });
  }

  const adjustment = isRecord
    ? await prisma.rankingAdjustment.upsert({
        where: { recordId: id },
        create: { recordId: id, scoreDelta },
        update: { scoreDelta },
      })
    : await prisma.rankingAdjustment.upsert({
        where: { trackId: id },
        create: { trackId: id, scoreDelta },
        update: { scoreDelta },
      });

  return NextResponse.json(serializeBigInt(adjustment));
}
