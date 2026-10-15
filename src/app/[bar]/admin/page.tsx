import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BAR_VALUES, serializeBigInt } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { SyncStatus, type SyncJob } from "@/components/admin/SyncStatus";
import { FeatureManager, type Feature } from "@/components/admin/FeatureManager";
import { MenuUploader } from "@/components/admin/MenuUploader";

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

  const [latestSync, features, latestCassetteSync] = await Promise.all([
    prisma.syncJob.findFirst({
      where: { bar: barValue, mediaType: "record" },
      orderBy: { startedAt: "desc" },
    }),
    prisma.feature.findMany({
      where: { bar: barValue },
      orderBy: { number: "asc" },
      include: { _count: { select: { featureItems: true } } },
    }),
    bar === "kagurazaka" ? prisma.syncJob.findFirst({ where: { bar: barValue, mediaType: "cassette" }, orderBy: { startedAt: "desc" } }) : Promise.resolve(null),
  ]);

  const sheetConfig = BAR_SHEET_CONFIGS[barValue];
  const sheetName = sheetConfig?.name ?? "";
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit#gid=${sheetConfig?.gid ?? "0"}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold text-white">
        {BAR_LABELS[bar] ?? bar} 管理画面
      </h1>

      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-white">
          ドリンクメニュー管理
        </h2>
        <p className="mb-3 text-sm text-zinc-400">
          ドリンクメニューのPDFをアップロードします。アップロード後にCloudFrontキャッシュが自動で無効化されます。
        </p>
        <MenuUploader bar={bar} />
      </section>

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

      {bar === "kagurazaka" && (
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold text-white">カセットリスト同期</h2>
          <p className="mb-3 text-sm text-zinc-400">
            <a className="text-blue-400 underline" href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit#gid=139140348`} target="_blank" rel="noopener noreferrer">神楽坂カセットテープリスト</a>と同期します。
          </p>
          <SyncStatus barValue={barValue} mediaType="cassette" latestSync={serializeBigInt(latestCassetteSync) as unknown as SyncJob | null} />
          <Link href={`/${bar}/admin/artists?context=cassettes`} className="mt-3 mr-4 inline-block text-sm text-blue-400 underline">カセットのアーティスト管理</Link>
          <Link href={`/${bar}/admin/cassettes`} className="mt-3 inline-block text-sm text-blue-400 underline">カセット一覧を見る</Link>
        </section>
      )}

      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-white">
          Record 管理
        </h2>
        <p className="mb-3 text-sm text-zinc-400">
          レコードのアーティスト情報を管理します。
        </p>
        <div className="flex gap-3">
          <Link
            href={`/${bar}/admin/artists?context=records`}
            className="inline-block rounded-md bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600"
          >
            アーティスト一覧を見る
          </Link>
          <Link
            href={`/${bar}/admin/records`}
            className="inline-block rounded-md bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600"
          >
            レコード一覧を見る
          </Link>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-white">
          Hi-Res 管理
        </h2>
        <p className="mb-3 text-sm text-zinc-400">
          Hi-Res トラックのアーティスト・アルバム・トラックを管理します。
        </p>
        <div className="flex gap-3">
          <Link
            href={`/${bar}/admin/artists?context=hires`}
            className="inline-block rounded-md bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600"
          >
            アーティスト一覧を見る
          </Link>
          <Link
            href={`/${bar}/admin/albums`}
            className="inline-block rounded-md bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600"
          >
            アルバム一覧を見る
          </Link>
          <Link
            href={`/${bar}/admin/tracks`}
            className="inline-block rounded-md bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600"
          >
            トラック一覧を見る
          </Link>
        </div>
      </section>

      <section className="mb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">特集管理</h2>
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

      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-semibold text-white">文言管理</h2>
        <p className="mb-3 text-sm text-zinc-400">
          サイト上に表示される文言を管理します。変更はデプロイ後に反映されます。
        </p>
        <Link
          href={`/${bar}/admin/labels`}
          className="inline-block rounded-md bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600"
        >
          文言一覧を見る
        </Link>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold text-white">
          アカウント管理
        </h2>
        <p className="mb-3 text-sm text-zinc-400">
          ログイン中: <span className="text-white font-medium">{session.user?.name}</span>
        </p>
        <div className="flex gap-3">
          <Link
            href={`/${bar}/admin/account`}
            className="inline-block rounded-md bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600"
          >
            パスワード変更
          </Link>
          <Link
            href={`/${bar}/admin/users`}
            className="inline-block rounded-md bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600"
          >
            ユーザー管理
          </Link>
        </div>
      </section>
    </div>
  );
}
