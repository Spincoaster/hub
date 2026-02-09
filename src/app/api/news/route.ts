import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export async function GET() {
  const entries = await prisma.newsEntry.findMany({
    orderBy: { publishedAt: "desc" },
    take: 5,
  });
  return NextResponse.json(serializeBigInt(entries));
}
