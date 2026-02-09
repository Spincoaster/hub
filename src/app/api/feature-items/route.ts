import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export async function POST(request: NextRequest) {
  // TODO: requireAuth()
  const body = await request.json();
  const featureItem = await prisma.featureItem.create({
    data: {
      featureId: body.featureId ? BigInt(body.featureId) : null,
      itemId: body.itemId,
      itemType: body.itemType,
      number: body.number,
      comment: body.comment,
    },
  });
  return NextResponse.json(serializeBigInt(featureItem), { status: 201 });
}
