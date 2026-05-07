import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt, BAR_VALUES, buildPrefixFilter } from "@/lib/utils";
import {
  getSortedAdminTrackIds,
  parseAdminListSort,
} from "@/lib/admin-list-sort";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const hasPrefix = searchParams.get("has_prefix");
  const query = searchParams.get("query");
  const bar = searchParams.get("bar");
  const artistId = searchParams.get("artistId");
  const albumId = searchParams.get("albumId");
  const sort = parseAdminListSort(searchParams.get("sort"));
  const barValue = bar && BAR_VALUES[bar] !== undefined ? BAR_VALUES[bar] : undefined;
  const parsedArtistId = artistId ? BigInt(artistId) : undefined;
  const parsedAlbumId = albumId ? BigInt(albumId) : undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (barValue !== undefined) {
    where.bar = barValue;
  }
  if (parsedArtistId !== undefined) {
    where.artistId = parsedArtistId;
  }
  if (parsedAlbumId !== undefined) {
    where.albumId = parsedAlbumId;
  }
  if (hasPrefix) {
    Object.assign(where, buildPrefixFilter(hasPrefix));
  }

  if (query) {
    const terms = query.split(/\s+/).filter(Boolean);
    where.AND = terms.map((term: string) => ({
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { artist: { name: { contains: term, mode: "insensitive" } } },
      ],
    }));
  }

  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = parseInt(searchParams.get("limit") ?? "500", 10);
  const skip = (page - 1) * limit;

  if (sort) {
    const [trackIds, total] = await Promise.all([
      getSortedAdminTrackIds({
        barValue,
        hasPrefix,
        artistId: parsedArtistId,
        albumId: parsedAlbumId,
        query,
        sort,
        take: limit,
        skip,
      }),
      prisma.track.count({ where }),
    ]);

    const tracks =
      trackIds.length === 0
        ? []
        : await prisma.track.findMany({
            where: { id: { in: trackIds } },
            include: {
              artist: true,
              album: true,
              rankingAdjustment: true,
              _count: { select: { likes: true } },
            },
          });

    const trackById = new Map(tracks.map((track) => [track.id.toString(), track]));
    const sortedTracks = trackIds.flatMap((id) => {
      const track = trackById.get(id.toString());
      return track ? [track] : [];
    });

    return NextResponse.json(serializeBigInt({ data: sortedTracks, total, page, limit }));
  }

  const [tracks, total] = await Promise.all([
    prisma.track.findMany({
      where,
      include: {
        artist: true,
        album: true,
        rankingAdjustment: true,
        _count: { select: { likes: true } },
      },
      orderBy: { name: "asc" },
      take: limit,
      skip,
    }),
    prisma.track.count({ where }),
  ]);

  return NextResponse.json(serializeBigInt({ data: tracks, total, page, limit }));
}

export async function POST(request: NextRequest) {
  // TODO: requireAuth()
  const body = await request.json();
  const track = await prisma.track.create({
    data: {
      name: body.name,
      phoneticName: body.phoneticName,
      furigana: body.furigana,
      number: body.number,
      bar: body.bar !== undefined ? (BAR_VALUES[body.bar] ?? body.bar) : null,
      artistId: body.artistId ? BigInt(body.artistId) : null,
      albumId: body.albumId ? BigInt(body.albumId) : null,
    },
  });
  return NextResponse.json(serializeBigInt(track), { status: 201 });
}
