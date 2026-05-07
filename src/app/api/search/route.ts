import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt, BAR_VALUES } from "@/lib/utils";
import { getSessionId } from "@/lib/session";
import {
  getAdjustedRecordLikeCounts,
  getAdjustedTrackLikeCounts,
} from "@/lib/ranking-adjustments";
import {
  assignRecordLikeCounts,
  assignTrackLikeCounts,
  recordLikeKey,
  trackLikeKey,
} from "@/lib/record-list-keys";

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
  const [recordLikeCounts, trackLikeCounts] = await Promise.all([
    getAdjustedRecordLikeCounts(recordIds),
    getAdjustedTrackLikeCounts(trackIds),
  ]);
  const likeCounts: Record<string, number> = {};
  assignRecordLikeCounts(likeCounts, recordLikeCounts);
  assignTrackLikeCounts(likeCounts, trackLikeCounts);

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
        if (like.recordId) likeMap[recordLikeKey(like.recordId)] = String(like.id);
        if (like.trackId) likeMap[trackLikeKey(like.trackId)] = String(like.id);
      }
    }
  }

  return NextResponse.json(serializeBigInt({ records, tracks, likeCounts, likeMap }));
}
