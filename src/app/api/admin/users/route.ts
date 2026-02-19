import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admins = await prisma.admin.findMany({
    select: { id: true, name: true, createdAt: true },
    orderBy: { id: "asc" },
  });

  return NextResponse.json(serializeBigInt(admins));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, password } = await request.json();
  if (!name || !password) {
    return NextResponse.json(
      { error: "ユーザー名とパスワードを入力してください" },
      { status: 400 },
    );
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "パスワードは6文字以上で入力してください" },
      { status: 400 },
    );
  }

  const existing = await prisma.admin.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json(
      { error: "このユーザー名は既に使用されています" },
      { status: 400 },
    );
  }

  const passwordDigest = await hash(password, 10);
  const admin = await prisma.admin.create({
    data: { name, passwordDigest },
    select: { id: true, name: true, createdAt: true },
  });

  return NextResponse.json(serializeBigInt(admin), { status: 201 });
}
