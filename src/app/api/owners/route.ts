import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export async function GET() {
  const owners = await prisma.owner.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(serializeBigInt(owners));
}

export async function POST(request: NextRequest) {
  // TODO: requireAuth()
  const body = await request.json();
  const owner = await prisma.owner.create({
    data: { name: body.name },
  });
  return NextResponse.json(serializeBigInt(owner), { status: 201 });
}
