import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // TODO: requireAuth()
  const { id } = await params;
  await prisma.featureItem.delete({ where: { id: BigInt(id) } });
  return NextResponse.json({ success: true });
}
