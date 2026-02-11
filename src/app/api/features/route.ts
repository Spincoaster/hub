import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export async function GET() {
  const features = await prisma.feature.findMany({
    orderBy: { number: "asc" },
  });

  // Group by category
  const grouped: Record<string, typeof features> = {};
  for (const feature of features) {
    const cat = feature.category ?? "uncategorized";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(feature);
  }

  return NextResponse.json(serializeBigInt(grouped));
}

export async function POST(request: NextRequest) {
  // TODO: requireAuth()
  const body = await request.json();
  const feature = await prisma.feature.create({
    data: {
      number: body.number,
      name: body.name,
      description: body.description,
      externalLink: body.externalLink,
      externalThumbnail: body.externalThumbnail,
      category: body.category,
      bar: body.bar ?? null,
    },
  });
  return NextResponse.json(serializeBigInt(feature), { status: 201 });
}
