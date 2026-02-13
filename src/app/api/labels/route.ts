import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export async function GET() {
  const labels = await prisma.label.findMany({
    orderBy: { key: "asc" },
  });
  return NextResponse.json(serializeBigInt(labels));
}
