import { NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.name) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { current, newPassword } = await request.json();
  if (!current || !newPassword) {
    return NextResponse.json(
      { error: "現在のパスワードと新しいパスワードを入力してください" },
      { status: 400 },
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "新しいパスワードは6文字以上で入力してください" },
      { status: 400 },
    );
  }

  const admin = await prisma.admin.findUnique({
    where: { name: session.user.name },
  });
  if (!admin?.passwordDigest) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  const isValid = await compare(current, admin.passwordDigest);
  if (!isValid) {
    return NextResponse.json(
      { error: "現在のパスワードが正しくありません" },
      { status: 400 },
    );
  }

  const passwordDigest = await hash(newPassword, 10);
  await prisma.admin.update({
    where: { id: admin.id },
    data: { passwordDigest },
  });

  return NextResponse.json({ message: "パスワードを変更しました" });
}
