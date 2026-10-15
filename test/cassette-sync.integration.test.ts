import assert from "node:assert/strict";
import { test } from "node:test";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { parseCassetteSheet } from "../src/lib/cassette-sheet";
import { syncCassetteItems } from "../src/lib/sync-cassettes";

const databaseUrl = process.env.CASSETTE_TEST_DATABASE_URL;

test("sync retains ids/likes, isolates records, defers unsafe deletions, and rolls back", { skip: !databaseUrl }, async () => {
  const url = new URL(databaseUrl!);
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname) && url.pathname.endsWith("_test"), "Use a disposable local test database");
  const pool = new Pool({ connectionString: databaseUrl });
  const db = new PrismaClient({ adapter: new PrismaPg(pool) });
  const header = ["場所", "番号", "所有者", "タイトル", "アーティスト", "A面１曲目", "B面１曲目", "コメント"];
  const a = ["TEST", "900001", "Test owner", "First title", "Test artist", "A", "B"];
  const b = ["TEST", "900002", "Test owner", "Second title", "Test artist"];
  try {
    // Roll back the entire fixture, including shared artists/owners, after assertions.
    await assert.rejects(db.$transaction(async (tx) => {
      assert.equal(await tx.cassette.count(), 0, "Test requires an empty cassette table");
      const record = await tx.record.create({ data: { bar: 2, location: "TEST", number: 900001, name: "Existing record" } });
      const sync = (rows: unknown[][]) => syncCassetteItems(tx, parseCassetteSheet([header, ...rows]));
      assert.equal((await sync([a, b])).created, 2);
      const cassette = await tx.cassette.findUniqueOrThrow({ where: { bar_location_number: { bar: 2, location: "TEST", number: 900001 } } });
      await tx.like.create({ data: { cassetteId: cassette.id, sessionId: "cassette-test" } });
      const feature = await tx.feature.create({ data: { name: "Sync deletion test", bar: 2 } });
      for (const itemType of ["Cassette", "Record", "Track"]) {
        await tx.featureItem.create({ data: { featureId: feature.id, itemId: Number(cassette.id), itemType } });
      }
      assert.equal((await sync([b, a])).updated, 0);
      const renamed = [...a]; renamed[3] = "Renamed"; renamed[5] = "Updated side A";
      assert.equal((await sync([renamed, b])).updated, 1);
      const after = await tx.cassette.findUniqueOrThrow({ where: { id: cassette.id } });
      assert.equal(after.name, "Renamed");
      assert.equal(after.sideAFirstTrack, "Updated side A");
      assert.equal(await tx.like.count({ where: { cassetteId: cassette.id } }), 1);
      const deferred = await sync([renamed, ["C", "107", "Owner"]]);
      assert.equal(deferred.deletionDeferred, true);
      assert.equal(deferred.deleted, 0);
      assert.equal(await tx.cassette.count(), 2);
      assert.equal(await tx.featureItem.count({ where: { featureId: feature.id } }), 3);
      const removed = await sync([b]);
      assert.equal(removed.deleted, 1);
      assert.equal(await tx.like.count({ where: { cassetteId: cassette.id } }), 0);
      assert.deepEqual((await tx.featureItem.findMany({ where: { featureId: feature.id }, orderBy: { itemType: "asc" } })).map(item => item.itemType), ["Record", "Track"]);
      assert.equal((await tx.record.findUniqueOrThrow({ where: { id: record.id } })).name, "Existing record");
      throw new Error("ROLLBACK_FIXTURE");
    }, { timeout: 30000 }), /ROLLBACK_FIXTURE/);
    assert.equal(await db.cassette.count(), 0);
    assert.equal(await db.record.count(), 0);
  } finally {
    await db.$disconnect();
    await pool.end();
  }
});
