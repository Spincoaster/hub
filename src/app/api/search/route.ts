import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt, BAR_VALUES } from "@/lib/utils";
import { getSessionId } from "@/lib/session";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");
  const bar = request.nextUrl.searchParams.get("bar");

  if (!query) {
    return NextResponse.json({ records: [], tracks: [], likeCounts: {}, likeMap: {} });
  }

  const barValue = bar && bar in BAR_VALUES ? BAR_VALUES[bar] : undefined;

  const terms = query.split(/\s+/).filter(Boolean);

  const recordTermFilter = terms.map((term) => ({
    OR: [
      { name: { contains: term, mode: "insensitive" as const } },
      { artist: { name: { contains: term, mode: "insensitive" as const } } },
      { artist: { phoneticName: { contains: term, mode: "insensitive" as const } } },
      { artist: { furigana: { contains: term, mode: "insensitive" as const } } },
    ],
  }));

  const trackTermFilter = terms.map((term) => ({
    OR: [
      { name: { contains: term, mode: "insensitive" as const } },
      { artist: { name: { contains: term, mode: "insensitive" as const } } },
      { artist: { phoneticName: { contains: term, mode: "insensitive" as const } } },
      { artist: { furigana: { contains: term, mode: "insensitive" as const } } },
      { album: { name: { contains: term, mode: "insensitive" as const } } },
    ],
  }));

  const [records, tracks] = await Promise.all([
    prisma.record.findMany({
      where: {
        ...(barValue !== undefined ? { bar: barValue } : {}),
        AND: recordTermFilter,
      },
      include: { artist: true, owner: true },
      orderBy: { name: "asc" },
      take: 50,
    }),
    prisma.track.findMany({
      where: {
        AND: trackTermFilter,
      },
      include: { artist: true, album: true },
      orderBy: { name: "asc" },
      take: 50,
    }),
  ]);

  const recordIds = records.map((r) => r.id);
  const trackIds = tracks.map((t) => t.id);

  // Fetch like counts
  const likeCounts: Record<string, number> = {};

  if (recordIds.length > 0) {
    const recordLikes = await prisma.like.groupBy({
      by: ["recordId"],
      where: { recordId: { in: recordIds } },
      _count: { recordId: true },
    });
    for (const l of recordLikes) {
      if (l.recordId) likeCounts[String(l.recordId)] = l._count.recordId;
    }
  }

  if (trackIds.length > 0) {
    const trackLikes = await prisma.like.groupBy({
      by: ["trackId"],
      where: { trackId: { in: trackIds } },
      _count: { trackId: true },
    });
    for (const l of trackLikes) {
      if (l.trackId) likeCounts[String(l.trackId)] = l._count.trackId;
    }
  }

  // Fetch likeMap for current session
  const sessionId = await getSessionId();
  const likeMap: Record<string, string> = {};

  if (sessionId) {
    const orConditions = [];
    if (recordIds.length > 0) orConditions.push({ recordId: { in: recordIds } });
    if (trackIds.length > 0) orConditions.push({ trackId: { in: trackIds } });

    if (orConditions.length > 0) {
      const likes = await prisma.like.findMany({
        where: { sessionId, OR: orConditions },
      });
      for (const like of likes) {
        const itemId = like.recordId ?? like.trackId;
        if (itemId) likeMap[String(itemId)] = String(like.id);
      }
    }
  }

  return NextResponse.json(serializeBigInt({ records, tracks, likeCounts, likeMap }));
}
