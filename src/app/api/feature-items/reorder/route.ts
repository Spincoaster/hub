import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  // TODO: requireAuth()
  const body = await request.json();
  const items: { id: string; number: number }[] = body.items;

  await prisma.$transaction(
    items.map((item) =>
      prisma.featureItem.update({
        where: { id: BigInt(item.id) },
        data: { number: item.number },
      })
    )
  );

  return NextResponse.json({ success: true });
}
