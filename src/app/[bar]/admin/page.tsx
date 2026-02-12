import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BAR_VALUES, serializeBigInt } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { SyncStatus, type SyncJob } from "@/components/admin/SyncStatus";
import { FeatureManager, type Feature } from "@/components/admin/FeatureManager";

export const dynamic = "force-dynamic";

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-white">
        {capitalize(bar)} Admin
      </h1>

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Record Sync
        </h2>
        <SyncStatus
          barValue={barValue}
          latestSync={serializeBigInt(latestSync) as unknown as SyncJob | null}
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Features</h2>
        <FeatureManager
          bar={bar}
          features={serializeBigInt(features) as unknown as Feature[]}
        />
      </section>
    </div>
  );
}
