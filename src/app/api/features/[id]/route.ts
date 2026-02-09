import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const feature = await prisma.feature.findUnique({
    where: { id: BigInt(id) },
    include: {
      featureItems: { orderBy: { number: "asc" } },
    },
  });

  if (!feature) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Resolve polymorphic item references (itemType: "Track" or "Record")
  const itemsWithData = await Promise.all(
    feature.featureItems.map(async (item) => {
      let itemData = null;
      if (item.itemId) {
        if (item.itemType === "Track") {
          itemData = await prisma.track.findUnique({
            where: { id: BigInt(item.itemId) },
            include: { artist: true, album: true },
          });
        } else if (item.itemType === "Record") {
          itemData = await prisma.record.findUnique({
            where: { id: BigInt(item.itemId) },
            include: { artist: true, owner: true },
          });
        }
      }
      return { ...item, itemData };
    })
  );

  return NextResponse.json(
    serializeBigInt({ ...feature, featureItems: itemsWithData })
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // TODO: requireAuth()
  const { id } = await params;
  const body = await request.json();
  const feature = await prisma.feature.update({
    where: { id: BigInt(id) },
    data: {
      number: body.number,
      name: body.name,
      description: body.description,
      externalLink: body.externalLink,
      externalThumbnail: body.externalThumbnail,
      category: body.category,
    },
  });
  return NextResponse.json(serializeBigInt(feature));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // TODO: requireAuth()
  const { id } = await params;
  // Delete associated feature items first
  await prisma.featureItem.deleteMany({ where: { featureId: BigInt(id) } });
  await prisma.feature.delete({ where: { id: BigInt(id) } });
  return NextResponse.json({ success: true });
}
