import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Step 1: Clean up dirty names (trim whitespace, remove control chars)
    const { rows: dirty } = await client.query(`
      SELECT id, name
      FROM artists
      WHERE name IS NOT NULL
        AND name != BTRIM(regexp_replace(name, E'[\\r\\n\\t]+', '', 'g'))
    `);
    if (dirty.length > 0) {
      console.log(`Step 1: Cleaning ${dirty.length} artist names with whitespace/control chars...\n`);
      for (const r of dirty) {
        const cleaned = r.name.replace(/[\r\n\t]+/g, "").trim();
        await client.query(`UPDATE artists SET name = $1 WHERE id = $2`, [cleaned, r.id]);
        console.log(`  ID=${r.id}: ${JSON.stringify(r.name)} → "${cleaned}"`);
      }
      console.log("");
    } else {
      console.log("Step 1: No dirty names found.\n");
    }

    // Also clean owners
    const { rows: dirtyOwners } = await client.query(`
      SELECT id, name
      FROM owners
      WHERE name IS NOT NULL
        AND name != BTRIM(regexp_replace(name, E'[\\r\\n\\t]+', '', 'g'))
    `);
    if (dirtyOwners.length > 0) {
      console.log(`Cleaning ${dirtyOwners.length} owner names...\n`);
      for (const r of dirtyOwners) {
        const cleaned = r.name.replace(/[\r\n\t]+/g, "").trim();
        await client.query(`UPDATE owners SET name = $1 WHERE id = $2`, [cleaned, r.id]);
        console.log(`  ID=${r.id}: ${JSON.stringify(r.name)} → "${cleaned}"`);
      }
      console.log("");
    }

    // Step 2: Find duplicates after cleanup (case-insensitive)
    const { rows: dupes } = await client.query(`
      SELECT LOWER(TRIM(name)) as normalized, array_agg(id ORDER BY id) as ids
      FROM artists
      WHERE name IS NOT NULL
      GROUP BY LOWER(TRIM(name))
      HAVING COUNT(*) > 1
    `);

    if (dupes.length === 0) {
      console.log("Step 2: No duplicate artists found after cleanup.");
      await client.query("COMMIT");
      return;
    }

    console.log(`Step 2: Found ${dupes.length} groups of duplicate artists.\n`);
    console.log("Merging (prefer artist with phonetic_name/furigana)...\n");

    for (const d of dupes) {
      // Load full data for all duplicates in this group
      const { rows: candidates } = await client.query(
        `SELECT id, name, phonetic_name, furigana FROM artists WHERE id = ANY($1::bigint[]) ORDER BY id`,
        [d.ids]
      );

      // Pick the best one: prefer the one with the most metadata
      const scored = candidates.map((c) => ({
        ...c,
        score: (c.phonetic_name ? 1 : 0) + (c.furigana ? 1 : 0),
      }));
      scored.sort((a, b) => b.score - a.score || Number(BigInt(a.id) - BigInt(b.id)));

      const keep = scored[0];
      const removeIds = scored.slice(1).map((s) => s.id);

      console.log(`"${d.normalized}": keep ID=${keep.id} (phonetic=${keep.phonetic_name ?? "null"}, furigana=${keep.furigana ?? "null"}), remove IDs=[${removeIds.join(", ")}]`);

      // Update records
      const recResult = await client.query(
        `UPDATE records SET artist_id = $1 WHERE artist_id = ANY($2::bigint[])`,
        [keep.id, removeIds]
      );
      if (recResult.rowCount && recResult.rowCount > 0) {
        console.log(`  Updated ${recResult.rowCount} records`);
      }

      // Update albums
      const albResult = await client.query(
        `UPDATE albums SET artist_id = $1 WHERE artist_id = ANY($2::bigint[])`,
        [keep.id, removeIds]
      );
      if (albResult.rowCount && albResult.rowCount > 0) {
        console.log(`  Updated ${albResult.rowCount} albums`);
      }

      // Update tracks
      const trkResult = await client.query(
        `UPDATE tracks SET artist_id = $1 WHERE artist_id = ANY($2::bigint[])`,
        [keep.id, removeIds]
      );
      if (trkResult.rowCount && trkResult.rowCount > 0) {
        console.log(`  Updated ${trkResult.rowCount} tracks`);
      }

      // Delete duplicates
      const delResult = await client.query(
        `DELETE FROM artists WHERE id = ANY($1::bigint[])`,
        [removeIds]
      );
      console.log(`  Deleted ${delResult.rowCount} duplicate(s)`);
    }

    await client.query("COMMIT");
    console.log("\nDone!");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
