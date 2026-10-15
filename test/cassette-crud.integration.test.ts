import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { Pool } from "pg";
import { encode } from "next-auth/jwt";

const databaseUrl = process.env.CASSETTE_TEST_DATABASE_URL;
const baseUrl = process.env.CASSETTE_TEST_BASE_URL;
const secret = process.env.CASSETTE_TEST_AUTH_SECRET;

test("manual cassette CRUD cleans only cassette feature references and rolls back invalid writes", { skip: !databaseUrl || !baseUrl || !secret }, async () => {
  const url = new URL(databaseUrl!);
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname) && url.pathname.endsWith("_test"));
  assert.ok(["127.0.0.1", "localhost"].includes(new URL(baseUrl!).hostname));
  const db = new Pool({ connectionString: databaseUrl });
  const marker = `crud-${randomUUID()}`;
  const token = await encode({ secret: secret!, salt: "authjs.session-token", token: { sub: marker, name: "Local CRUD test" } });
  const call = (path: string, method: string, body?: unknown, authenticated = true) => fetch(`${baseUrl}${path}`, {
    method, headers: { "Content-Type": "application/json", ...(authenticated ? { Cookie: `authjs.session-token=${token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  let id: string | undefined;
  let featureId: string | undefined;
  const artistId = (await db.query('INSERT INTO artists(name,updated_at) VALUES ($1,NOW()) RETURNING id',[marker])).rows[0].id;
  const ownerId = (await db.query('INSERT INTO owners(name,updated_at) VALUES ($1,NOW()) RETURNING id',[marker])).rows[0].id;
  try {
    const body = { name: marker, location: marker, number: 1, bar: "kagurazaka", artistId, ownerId, sideAFirstTrack: "Side A song", sideBFirstTrack: "Side B song", comment: "comment", phoneticName: "reading", furigana: "よみ", scoreDelta: 4 };
    assert.equal((await call('/api/cassettes','POST',body,false)).status,401);
    assert.equal((await call('/api/cassettes','POST',{...body, number:0})).status,400);
    const created = await call('/api/cassettes','POST',body);
    assert.equal(created.status,201);
    id = (await created.json()).id;
    assert.equal((await call('/api/cassettes','POST',body)).status,409);
    await db.query('INSERT INTO likes(session_id,cassette_id) VALUES ($1,$2)',[marker,id]);
    featureId = (await db.query('INSERT INTO features(name,bar,updated_at) VALUES ($1,2,NOW()) RETURNING id',[marker])).rows[0].id;
    assert.equal((await call('/api/feature-items', 'POST', { featureId, itemId: Number(id), itemType: 'Cassette' })).status, 201);
    for (const type of ['Record','Track']) await db.query('INSERT INTO feature_items(feature_id,item_id,item_type,updated_at) VALUES ($1,$2,$3,NOW())',[featureId,id,type]);
    // Reject both another store and the unassigned state without partially saving edits.
    for (const bar of [0, 1, null]) {
      const rejected = await call(`/api/features/${featureId}`, 'PUT', { bar, name: 'must not save' });
      assert.equal(rejected.status, 409);
      assert.match((await rejected.json()).error, /カセット/);
      const feature = (await db.query('SELECT bar,name FROM features WHERE id=$1', [featureId])).rows[0];
      assert.equal(feature.bar, 2);
      assert.equal(feature.name, marker);
      assert.equal((await db.query('SELECT count(*)::int AS n FROM feature_items WHERE feature_id=$1', [featureId])).rows[0].n, 3);
    }
    assert.equal((await call(`/api/features/${featureId}`, 'PUT', { bar: 2, description: 'same store' })).status, 200);
    assert.equal((await call(`/api/features/${featureId}`, 'PUT', { description: 'bar omitted' })).status, 200);
    assert.equal((await db.query('SELECT bar FROM features WHERE id=$1', [featureId])).rows[0].bar, 2);
    const edited = await call(`/api/cassettes/${id}`,'PUT',{...body,name:marker+' updated',number:2,ownerId:null,sideAFirstTrack:'New A',scoreDelta:6});
    assert.equal(edited.status,200);
    const detail = await (await call(`/api/cassettes/${id}`,'GET')).json();
    assert.equal(detail.id,id); assert.equal(detail.name,marker+' updated'); assert.equal(detail.ownerId,null);
    assert.equal(detail.number,2); assert.equal(detail.sideAFirstTrack,'New A'); assert.equal(detail.rankingAdjustment.scoreDelta,6);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM likes WHERE cassette_id=$1',[id])).rows[0].n,1);
    assert.equal((await call(`/api/cassettes/${id}`,'PUT',{name:'',scoreDelta:8})).status,400);
    assert.equal((await call(`/api/cassettes/${id}`,'PUT',{name:'should roll back',ownerId:'9223372036854775807',scoreDelta:8})).status,400);
    const unchanged = await (await call(`/api/cassettes/${id}`,'GET')).json();
    assert.equal(unchanged.name,marker+' updated'); assert.equal(unchanged.rankingAdjustment.scoreDelta,6);
    assert.equal((await call(`/api/cassettes/${id}`,'DELETE',undefined,false)).status,401);
    assert.equal((await call(`/api/cassettes/${id}`,'DELETE')).status,200);
    assert.equal((await call(`/api/cassettes/${id}`,'GET')).status,404);
    assert.equal((await call(`/api/cassettes/${id}`,'DELETE')).status,404);
    assert.deepEqual((await db.query('SELECT item_type FROM feature_items WHERE feature_id=$1 ORDER BY item_type',[featureId])).rows.map(r=>r.item_type),['Record','Track']);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM likes WHERE cassette_id=$1',[id])).rows[0].n,0);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM ranking_adjustments WHERE cassette_id=$1',[id])).rows[0].n,0);
    // Once the cassette is removed, Record/Track items do not block store changes.
    assert.equal((await call(`/api/features/${featureId}`, 'PUT', { bar: 0 })).status, 200);
    assert.equal((await db.query('SELECT bar FROM features WHERE id=$1', [featureId])).rows[0].bar, 0);
    assert.equal((await call('/kagurazaka/admin/cassettes/new','GET')).status,200);
  } finally {
    if (featureId) { await db.query('DELETE FROM feature_items WHERE feature_id=$1',[featureId]); await db.query('DELETE FROM features WHERE id=$1',[featureId]); }
    if (id) await db.query('DELETE FROM cassettes WHERE id=$1',[id]);
    await db.query('DELETE FROM artists WHERE id=$1',[artistId]);
    await db.query('DELETE FROM owners WHERE id=$1',[ownerId]);
    await db.end();
  }
});
