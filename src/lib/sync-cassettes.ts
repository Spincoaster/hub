import { deleteCassettes } from "./delete-cassettes";
import type { Prisma } from "@/generated/prisma/client";
import { CASSETTE_BAR, parseCassetteSheet } from "./cassette-sheet";

export async function syncCassetteItems(tx: Prisma.TransactionClient, { items, skippedRows }: ReturnType<typeof parseCassetteSheet>) {
  const existing = await tx.cassette.findMany({ where: { bar: CASSETTE_BAR } });
  const previous = new Map(existing.map((item) => [`${item.location}:${item.number}`, item]));
  const artistIds = new Map<string, bigint>();
  const ownerIds = new Map<string, bigint>();
  let created = 0;
  let updated = 0;
  const changes: Array<{ type: "created" | "updated" | "deleted"; name: string; artist: string; owner: string; number: number }> = [];
  for (const item of items) {
    const { artistName, ownerName, ...fields } = item;
    const artistKey = artistName.toLowerCase();
    if (!artistIds.has(artistKey)) {
      const artist = await tx.artist.findFirst({ where: { name: { equals: artistName, mode: "insensitive" } }, orderBy: { id: "asc" } }) ?? await tx.artist.create({ data: { name: artistName } });
      artistIds.set(artistKey, artist.id);
    }
    const ownerKey = ownerName.toLowerCase();
    if (ownerName && !ownerIds.has(ownerKey)) {
      const owner = await tx.owner.findFirst({ where: { name: { equals: ownerName, mode: "insensitive" } }, orderBy: { id: "asc" } }) ?? await tx.owner.create({ data: { name: ownerName } });
      ownerIds.set(ownerKey, owner.id);
    }
    const data = { ...fields, bar: CASSETTE_BAR, artistId: artistIds.get(artistKey)!, ownerId: ownerIds.get(ownerKey) ?? null };
    const old = previous.get(`${item.location}:${item.number}`);
    if (!old) {
      await tx.cassette.create({ data });
      created++;
      changes.push({ type: "created", name: item.name, artist: artistName, owner: ownerName, number: item.number });
    } else if (Object.entries(data).some(([key, value]) => old[key as keyof typeof old] !== value)) {
      await tx.cassette.update({ where: { id: old.id }, data });
      updated++;
      changes.push({ type: "updated", name: item.name, artist: artistName, owner: ownerName, number: item.number });
    }
    previous.delete(`${item.location}:${item.number}`);
  }
  // Incomplete rows may represent existing items being edited. Retain those items until the sheet is complete.
  const removed = skippedRows.length === 0 ? [...previous.values()] : [];
  if (removed.length) await deleteCassettes(tx, removed.map((item) => item.id));
  for (const item of removed) changes.push({ type: "deleted", name: item.name, artist: "", owner: "", number: item.number });
  const result = { sheetRows: items.length, created, updated, deleted: removed.length, skippedRows, deletionDeferred: skippedRows.length > 0, changes };
  return result;
}
