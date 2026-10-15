import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { encode } from "next-auth/jwt";

const databaseUrl = process.env.CASSETTE_TEST_DATABASE_URL;
const baseUrl = process.env.CASSETTE_TEST_BASE_URL;
const authSecret = process.env.CASSETTE_TEST_AUTH_SECRET;

test("cassette admin/search/ranking parity through HTTP", { skip: !databaseUrl || !baseUrl || !authSecret }, async () => {
  const dbUrl = new URL(databaseUrl!);
  assert.ok(["127.0.0.1", "localhost"].includes(dbUrl.hostname) && dbUrl.pathname.endsWith("_test"));
  assert.ok(["127.0.0.1", "localhost"].includes(new URL(baseUrl!).hostname));
  const pool = new Pool({ connectionString: databaseUrl });
  const marker = `cassette-parity-${randomUUID()}`;
  const sessionId = `session-${marker}`;
  const token = await encode({ secret: authSecret!, salt: "authjs.session-token", token: { sub: marker, name: "Local integration test" } });
  const cookie = `authjs.session-token=${token}; hub_session_id=${sessionId}`;
  const call = async (path: string, method = "GET", body?: unknown, authenticated = true) => {
    return fetch(`${baseUrl}${path}`, { method, headers: { "Content-Type": "application/json", ...(authenticated ? { Cookie: cookie } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  };
  let artistId: string | undefined;
  try {
    artistId = (await pool.query('INSERT INTO artists(name,updated_at) VALUES ($1,NOW()) RETURNING id', [marker])).rows[0].id;
    const ids: string[] = [];
    for (let i = 0; i < 3; i++) {
      ids.push((await pool.query('INSERT INTO cassettes(name,location,number,bar,artist_id,updated_at) VALUES ($1,$2,$3,2,$4,NOW()) RETURNING id', [`${marker}-${i}`, marker, i + 1, artistId])).rows[0].id);
    }
    const [a, b, c] = ids;
    for (const [id, count] of [[a, 2], [c, 3]] as const) {
      for (let i = 0; i < count; i++) await pool.query('INSERT INTO likes(session_id,cassette_id) VALUES ($1,$2)', [`${marker}-${id}-${i}`, id]);
    }
    assert.equal((await call(`/api/cassettes/${a}`, "PUT", { phoneticName: marker }, false)).status, 401);
    assert.equal((await call(`/api/cassettes/${a}`, "PUT", { phoneticName: `${marker}-reading`, furigana: "かせっとけんしょう" })).status, 200);
    const detail = await (await call(`/api/cassettes/${a}`)).json();
    assert.equal(detail.furigana, "かせっとけんしょう");
    for (const [id, delta] of [[b, 5], [c, -10]] as const) {
      assert.equal((await call('/api/ranking-adjustments', 'POST', { itemType: 'Cassette', itemId: id, scoreDelta: delta })).status, 200);
    }
    const prefix = `/api/cassettes?bar=kagurazaka&query=${marker}`;
    const adjusted = await (await call(`${prefix}&sort=adjusted_likes_desc`)).json();
    assert.deepEqual(adjusted.data.map((x: { id: string }) => x.id), [b, a, c]);
    const raw = await (await call(`${prefix}&sort=likes_desc`)).json();
    assert.deepEqual(raw.data.map((x: { id: string }) => x.id), [c, a, b]);
    const page = await (await call(`${prefix}&sort=adjusted_likes_desc&page=2&limit=1`)).json();
    assert.equal(page.total, 3); assert.equal(page.data[0].id, a);
    const artistList = await (await call(`/api/artists?bar=kagurazaka&context=cassettes&query=${marker}`)).json();
    assert.equal(artistList.data[0].id, artistId);
    assert.equal(artistList.data[0]._count.cassettes, 3);
    const artist = await (await call(`/api/artists/${artistId}`)).json();
    assert.equal(artist.cassettes.length, 3);
    const search = await (await call(`/api/search?bar=kagurazaka&query=${marker}-reading`)).json();
    assert.equal(search.cassettes[0].id, a);
    const rankedSearch = await (await call(`/api/search?bar=kagurazaka&query=${marker}`)).json();
    assert.equal(rankedSearch.likeCounts[`Cassette:${b}`], 5);
    assert.equal(rankedSearch.likeCounts[`Cassette:${c}`], 0);
    const liked = await (await call('/api/likes', 'POST', { cassetteId: b })).json();
    assert.equal(liked.likeCount, 6);
    const unliked = await (await call(`/api/likes/${liked.id}`, 'DELETE')).json();
    assert.equal(unliked.likeCount, 5);
    const popular = await (await call('/kagurazaka/cassettes/popular')).text();
    assert.ok(popular.includes(`${marker}-1`));
    assert.ok(!popular.includes(`${marker}-2`));
    assert.ok(popular.indexOf(`${marker}-1`) < popular.indexOf(`${marker}-0`));
    for (const path of ['/kagurazaka/admin/cassettes', `/kagurazaka/admin/cassettes/${a}/edit`, '/kagurazaka/admin/artists?context=cassettes', `/kagurazaka/admin/artists/${artistId}?context=cassettes`]) {
      assert.equal((await call(path)).status, 200);
    }
    assert.equal((await call('/api/ranking-adjustments','POST',{itemType:'Cassette',itemId:b,scoreDelta:0})).status,200);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM ranking_adjustments WHERE cassette_id=$1',[b])).rows[0].n,0);
  } finally {
    if (artistId) {
      await pool.query('DELETE FROM cassettes WHERE artist_id=$1',[artistId]);
      await pool.query('DELETE FROM artists WHERE id=$1',[artistId]);
    }
    await pool.end();
  }
});
