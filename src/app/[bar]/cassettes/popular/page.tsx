import { notFound } from "next/navigation";
import { BAR_VALUES } from "@/lib/utils";
import { popularCassettes } from "@/lib/cassettes";
import { RecordList } from "@/components/RecordList";
import { NAV, TABLE, SEARCH } from "@/lib/labels";

export const dynamic = "force-dynamic";

function TableHeader() {
  return (
    <div className="hidden items-stretch border-b border-zinc-600 text-xs font-semibold text-white md:flex">
      <span className="flex min-w-0 flex-1 items-stretch">
        <span className="flex w-1/2 items-center py-2 pl-2 pr-4">{TABLE.title}</span>
        <span className="w-px self-stretch bg-zinc-600" />
        <span className="flex w-1/2 items-center py-2 pl-4">{TABLE.artist}</span>
      </span>
      <span className="w-16 shrink-0 pr-2" />
    </div>
  );
}

export default async function PopularCassettesPage({
  params,
}: {
  params: Promise<{ bar: string }>;
}) {
  const { bar } = await params;
  if (bar !== "kagurazaka") notFound();
  const ranking = await popularCassettes(BAR_VALUES[bar], 100);

  return (
    <div className="mx-auto max-w-7xl px-4">
      <h1 className="mb-6 text-3xl font-bold">{NAV.popularCassettes}</h1>
      <TableHeader />
      <RecordList {...ranking} />
      {ranking.items.length === 0 && (
        <p className="py-8 text-sm text-zinc-400">{SEARCH.noPopularCassettes}</p>
      )}
    </div>
  );
}
