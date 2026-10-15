import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { deleteCassettes } from "../src/lib/delete-cassettes";

const databaseUrl = process.env.CASSETTE_TEST_DATABASE_URL;
const baseUrl = process.env.CASSETTE_TEST_BASE_URL;

test("feature additions wait for cassette deletion and cannot leave dangling references", { skip: !databaseUrl || !baseUrl }, async () => {
  const url = new URL(databaseUrl!);
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname) && url.pathname.endsWith("_test"));
  assert.ok(["127.0.0.1", "localhost"].includes(new URL(baseUrl!).hostname));
  const pool = new Pool({ connectionString: databaseUrl });
  const db = new PrismaClient({ adapter: new PrismaPg(pool) });
  const marker = `race-${randomUUID()}`;
  const cassette = await db.cassette.create({ data: { name: marker, location: marker, number: 1, bar: 2 } });
  const feature = await db.feature.create({ data: { name: marker, bar: 2 } });
  const add = () => fetch(`${baseUrl}/api/feature-items`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ featureId: String(feature.id), itemId: Number(cassette.id), itemType: "Cassette" }),
  });
  let request: Promise<Response> | undefined;
  try {
    // The insertion-first case: deletion cleans an already committed reference.
    assert.equal((await add()).status, 201);
    await db.$transaction(async (tx) => {
      const [{ pid }] = await tx.$queryRaw<Array<{ pid: number }>>`SELECT pg_backend_pid() AS pid`;
      await deleteCassettes(tx, [cassette.id]);
      // Keep deletion uncommitted while the actual HTTP insertion attempts its read.
      request = add();
      let blocked = false;
      for (let attempt = 0; attempt < 60; attempt++) {
        const result = await pool.query(
          'SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE $1::int = ANY(pg_blocking_pids(pid))) AS blocked', [pid],
        );
        if (result.rows[0].blocked) { blocked = true; break; }
        await delay(25);
      }
      assert.ok(blocked, "Feature insertion must wait for the cassette deletion lock");
    }, { timeout: 10000 });
    assert.equal((await request!).status, 400);
    assert.equal(await db.cassette.count({ where: { id: cassette.id } }), 0);
    assert.equal(await db.featureItem.count({ where: { featureId: feature.id } }), 0);
  } finally {
    if (request) await request;
    await db.featureItem.deleteMany({ where: { featureId: feature.id } });
    await db.feature.delete({ where: { id: feature.id } });
    await db.cassette.deleteMany({ where: { id: cassette.id } });
    await db.$disconnect();
    await pool.end();
  }
});

test("cassette deletion waits for an uncommitted feature insertion before cleanup", { skip: !databaseUrl }, async () => {
  const url = new URL(databaseUrl!);
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname) && url.pathname.endsWith("_test"));
  const pool = new Pool({ connectionString: databaseUrl });
  const db = new PrismaClient({ adapter: new PrismaPg(pool) });
  const marker = `insert-first-${randomUUID()}`;
  const cassette = await db.cassette.create({ data: { name: marker, location: marker, number: 1, bar: 2 } });
  const feature = await db.feature.create({ data: { name: marker, bar: 2 } });
  const insertion = await pool.connect();
  let deletion: Promise<{ count: number }> | undefined;
  try {
    await insertion.query('BEGIN');
    const { rows: [{ pid }] } = await insertion.query('SELECT pg_backend_pid() AS pid');
    await insertion.query('SELECT bar FROM features WHERE id=$1 FOR UPDATE', [String(feature.id)]);
    await insertion.query('SELECT bar FROM cassettes WHERE id=$1 FOR UPDATE', [String(cassette.id)]);
    await insertion.query('INSERT INTO feature_items(feature_id,item_id,item_type,updated_at) VALUES($1,$2,$3,NOW())', [String(feature.id), Number(cassette.id), 'Cassette']);
    deletion = db.$transaction(tx => deleteCassettes(tx, [cassette.id]), { timeout: 10000 });
    let blocked = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      const result = await pool.query('SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE $1::int = ANY(pg_blocking_pids(pid))) AS blocked', [pid]);
      if (result.rows[0].blocked) { blocked = true; break; }
      await delay(25);
    }
    assert.ok(blocked, "Deletion must wait for insertion to commit");
    await insertion.query('COMMIT');
    assert.equal((await deletion).count, 1);
    assert.equal(await db.featureItem.count({ where: { featureId: feature.id } }), 0);
  } finally {
    await insertion.query('ROLLBACK');
    insertion.release();
    if (deletion) await deletion;
    await db.featureItem.deleteMany({ where: { featureId: feature.id } });
    await db.feature.delete({ where: { id: feature.id } });
    await db.cassette.deleteMany({ where: { id: cassette.id } });
    await db.$disconnect();
    await pool.end();
  }
});
