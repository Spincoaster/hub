import { notFound } from "next/navigation";
import { SEARCH } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { BAR_VALUES } from "@/lib/utils";
import { RecordList } from "@/components/RecordList";
import { cassetteLikes, cassetteListItem } from "@/lib/cassettes";

export default async function ArtistCassettesPage({
  params,
}: {
  params: Promise<{ bar: string; id: string }>;
}) {
  const { bar, id } = await params;
  if (bar !== "kagurazaka" || !/^\d+$/.test(id)) notFound();

  const artist = await prisma.artist.findUnique({
    where: { id: BigInt(id) },
    include: {
      cassettes: {
        include: { owner: true },
        where: { bar: BAR_VALUES[bar] },
        orderBy: { name: "asc" },
      },
    },
  });
  if (!artist) notFound();

  const items = artist.cassettes.map((item) =>
    cassetteListItem({ ...item, artist }),
  );
  const likes = await cassetteLikes(artist.cassettes.map((item) => item.id));

  return (
    <div className="mx-auto max-w-7xl px-4">
      <div className="mb-6">
        <h1 className="mt-2 text-4xl font-normal tracking-tight">
          {artist.name}
        </h1>
        <p className="mt-2 text-sm text-white">{SEARCH.cassettesLabel}</p>
      </div>

      <div className="flex flex-col">
        <RecordList items={items} {...likes} singleColumn />
        {items.length === 0 && (
          <p className="py-8 text-center text-white">{SEARCH.noCassettes}</p>
        )}
      </div>
    </div>
  );
}
