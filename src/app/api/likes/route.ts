import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateSessionId, getSessionId } from "@/lib/session";
import { serializeBigInt } from "@/lib/utils";
import { getAdjustedLikeCount } from "@/lib/ranking-adjustments";

export async function POST(request: NextRequest) {
  const sessionId = await getOrCreateSessionId();
  const body = await request.json();

  const recordId = body.recordId ? BigInt(body.recordId) : null;
  const trackId = body.trackId ? BigInt(body.trackId) : null;

  const cassetteId = body.cassetteId ? BigInt(body.cassetteId) : null;

  if ([recordId, trackId, cassetteId].filter(Boolean).length !== 1) {
    return NextResponse.json(
      { error: "Provide exactly one of recordId, trackId or cassetteId" },
      { status: 400 },
    );
  }

  try {
    const like = await prisma.like.create({
      data: { sessionId, recordId, trackId, cassetteId },
    });
    const likeCount = await getAdjustedLikeCount({ recordId, trackId, cassetteId });

    return NextResponse.json(serializeBigInt({ ...like, likeCount }), { status: 201 });
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Already liked" },
        { status: 409 },
      );
    }
    throw e;
  }
}

export async function GET() {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return NextResponse.json([]);
  }

  const likes = await prisma.like.findMany({
    where: { sessionId },
  });

  return NextResponse.json(serializeBigInt(likes));
}
