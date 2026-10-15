import { Prisma } from "@/generated/prisma/client";

// Call inside the same transaction as the deletion to keep polymorphic references consistent.
export async function deleteCassettes(tx: Prisma.TransactionClient, ids: bigint[]) {
  if (!ids.length) return { count: 0 };
  // Lock before cleaning polymorphic references so concurrent additions cannot slip in.
  // Sort batch locks to keep simultaneous deletions from acquiring them in opposite orders.
  await tx.$queryRaw(Prisma.sql`
    SELECT id FROM cassettes WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR UPDATE
  `);
  // FeatureItem.itemId is an Int even though media IDs are BigInt.
  const featureIds = ids.filter((id) => id <= BigInt(2147483647)).map(Number);
  if (featureIds.length) {
    await tx.featureItem.deleteMany({ where: { itemType: "Cassette", itemId: { in: featureIds } } });
  }
  return tx.cassette.deleteMany({ where: { id: { in: ids } } });
}
