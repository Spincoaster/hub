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

  // Resolve polymorphic item references.
  const itemsWithData = await Promise.all(
    feature.featureItems.map(async (item) => {
      let itemData = null;
      if (item.itemId) {
        if (item.itemType === "Track") {
          itemData = await prisma.track.findUnique({
            where: { id: BigInt(item.itemId) },
            include: { artist: true, album: true, _count: { select: { likes: true } } },
          });
        } else if (item.itemType === "Cassette") {
          itemData = await prisma.cassette.findUnique({
            where: { id: BigInt(item.itemId) },
            include: { artist: true, owner: true, _count: { select: { likes: true } } },
          });
        } else if (item.itemType === "Record") {
          itemData = await prisma.record.findUnique({
            where: { id: BigInt(item.itemId) },
            include: { artist: true, owner: true, _count: { select: { likes: true } } },
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
  return prisma.$transaction(async (tx) => {
    // Serialize bar changes with cassette additions to this feature.
    const [current] = await tx.$queryRaw<Array<{ bar: number | null }>>`
      SELECT bar FROM features WHERE id = ${BigInt(id)} FOR UPDATE
    `;
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const nextBar = body.bar === undefined ? current.bar : body.bar;
    if (nextBar !== current.bar && await tx.featureItem.count({
      where: { featureId: BigInt(id), itemType: "Cassette" },
    })) {
      return NextResponse.json({
        error: "カセットを含む特集は店舗を変更できません。先に特集からカセットを外してください。",
      }, { status: 409 });
    }
    const feature = await tx.feature.update({
      where: { id: BigInt(id) },
      data: {
        number: body.number,
        name: body.name,
        description: body.description,
        externalLink: body.externalLink,
        externalThumbnail: body.externalThumbnail,
        category: body.category,
        bar: nextBar,
      },
    });
    return NextResponse.json(serializeBigInt(feature));
  });
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
