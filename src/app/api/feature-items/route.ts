import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export async function POST(request: NextRequest) {
  // TODO: requireAuth()
  const body = await request.json();
  if (body.itemType === "Cassette") {
    if (!body.featureId || !Number.isSafeInteger(body.itemId) || body.itemId < 1) {
      return NextResponse.json({ error: "Invalid cassette reference" }, { status: 400 });
    }
    return prisma.$transaction(async (tx) => {
      const [feature] = await tx.$queryRaw<Array<{ bar: number | null }>>`
        SELECT bar FROM features WHERE id = ${BigInt(body.featureId)} FOR UPDATE
      `;
      // Share the deletion lock until the feature reference has been inserted.
      const [cassette] = await tx.$queryRaw<Array<{ bar: number }>>`
        SELECT bar FROM cassettes WHERE id = ${BigInt(body.itemId)} FOR UPDATE
      `;
      if (!feature || !cassette || feature.bar !== cassette.bar) {
        return NextResponse.json({ error: "Cassette must belong to the feature's bar" }, { status: 400 });
      }
      const item = await tx.featureItem.create({ data: {
        featureId: BigInt(body.featureId), itemId: body.itemId, itemType: body.itemType,
        number: body.number, comment: body.comment,
      } });
      return NextResponse.json(serializeBigInt(item), { status: 201 });
    });
  }
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
