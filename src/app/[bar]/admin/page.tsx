import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BAR_VALUES, serializeBigInt } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { SyncStatus, type SyncJob } from "@/components/admin/SyncStatus";
import { FeatureManager, type Feature } from "@/components/admin/FeatureManager";

export const dynamic = "force-dynamic";

const SPREADSHEET_ID = "1Zl5dVBUjs1Tp2WEhS79GPtqgwQf69N9sNUghiNccdZ8";

const BAR_LABELS: Record<string, string> = {
  shinjuku: "Shinjuku",
  ebisu: "Ebisu",
  kagurazaka: "Kagurazaka",
};

const BAR_SHEET_CONFIGS: Record<number, { name: string; gid: string }> = {
  0: { name: "新宿レコードリスト", gid: "0" },
  1: { name: "恵比寿レコードリスト", gid: "855524439" },
  2: { name: "神楽坂レコードリスト", gid: "2078407823" },
};

export default async function AdminPage({
  params,
}: {
  params: Promise<{ bar: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { bar } = await params;
  const barValue = BAR_VALUES[bar];

  const [latestSync, features] = await Promise.all([
    prisma.syncJob.findFirst({
      where: { bar: barValue },
      orderBy: { startedAt: "desc" },
    }),
    prisma.feature.findMany({
      where: { bar: barValue },
      orderBy: { number: "asc" },
      include: { _count: { select: { featureItems: true } } },
    }),
  ]);

  const sheetConfig = BAR_SHEET_CONFIGS[barValue];
  const sheetName = sheetConfig?.name ?? "";
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit#gid=${sheetConfig?.gid ?? "0"}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-white">
        {BAR_LABELS[bar] ?? bar} 管理画面
      </h1>

      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-white">
          レコードリスト同期
        </h2>
        <p className="mb-3 text-sm text-zinc-400">
          レコードリストをスプレッドシートの「
          <Link
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline hover:text-blue-300"
          >
            {sheetName}
          </Link>
          」と同期します。
        </p>
        <SyncStatus
          barValue={barValue}
          latestSync={serializeBigInt(latestSync) as unknown as SyncJob | null}
        />
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">特集</h2>
          <a
            href={`/${bar}/features/new`}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            新規作成
          </a>
        </div>
        <p className="mb-3 text-sm text-zinc-400">
          トップページの下部に自由に特集リストを追加できます。番号順に並びます。
        </p>
        <FeatureManager
          bar={bar}
          features={serializeBigInt(features) as unknown as Feature[]}
        />
      </section>
    </div>
  );
}
