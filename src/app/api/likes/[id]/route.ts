import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionId } from "@/lib/session";
import { getAdjustedLikeCount } from "@/lib/ranking-adjustments";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  const { id } = await params;
  const like = await prisma.like.findUnique({
    where: { id: BigInt(id) },
  });

  if (!like || like.sessionId !== sessionId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.like.delete({ where: { id: like.id } });
  const likeCount = await getAdjustedLikeCount({
    recordId: like.recordId,
    trackId: like.trackId,
  });

  return NextResponse.json({ ok: true, likeCount });
}
