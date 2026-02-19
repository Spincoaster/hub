import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const target = await prisma.admin.findUnique({
    where: { id: BigInt(id) },
  });
  if (!target) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  if (target.name === session.user.name) {
    return NextResponse.json(
      { error: "自分自身は削除できません" },
      { status: 400 },
    );
  }

  await prisma.admin.delete({ where: { id: BigInt(id) } });

  return NextResponse.json({ message: "ユーザーを削除しました" });
}
