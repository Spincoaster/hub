import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query");

  if (!query) {
    return NextResponse.json({ artists: [], albums: [] });
  }

  const [artists, albums] = await Promise.all([
    prisma.artist.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { phoneticName: { contains: query, mode: "insensitive" } },
          { furigana: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { name: "asc" },
      take: 50,
    }),
    prisma.album.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { phoneticName: { contains: query, mode: "insensitive" } },
          { furigana: { contains: query, mode: "insensitive" } },
        ],
      },
      include: { artist: true },
      orderBy: { name: "asc" },
      take: 50,
    }),
  ]);

  return NextResponse.json(serializeBigInt({ artists, albums }));
}
