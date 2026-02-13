import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { serializeBigInt } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { LabelEditor, type LabelRow } from "@/components/admin/LabelEditor";
import { DeployButton } from "@/components/admin/DeployButton";

export const dynamic = "force-dynamic";

export default async function LabelsPage({
  params,
}: {
  params: Promise<{ bar: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { bar } = await params;

  const labels = await prisma.label.findMany({
    orderBy: { key: "asc" },
  });

  const serialized = serializeBigInt(labels).map((l) => ({
    id: String(l.id),
    key: l.key,
    value: l.value,
  })) as LabelRow[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href={`/${bar}/admin`}
        className="text-sm text-zinc-400 hover:text-white"
      >
        &larr; 管理画面
      </Link>
      <h1 className="mb-2 mt-2 text-3xl font-bold text-white">文言管理</h1>
      <p className="mb-6 text-sm text-zinc-400">
        サイト上に表示される文言を管理します。変更はデプロイ後に反映されます。
      </p>

      <div className="mb-8">
        <DeployButton />
      </div>

      <LabelEditor labels={serialized} />
    </div>
  );
}
