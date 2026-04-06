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
    const bars = [
      { name: "shinjuku", bar: 0 },
      { name: "ebisu", bar: 1 },
      { name: "kagurazaka", bar: 2 },
    ];

    for (const b of bars) {
      const records = await client.query(
        `SELECT id FROM records WHERE bar = $1 ORDER BY random() LIMIT 20`,
        [b.bar]
      );
      const recordIds = records.rows.map((r: { id: number }) => r.id);

      let trackIds: number[] = [];
      if (b.bar === 0) {
        const tracks = await client.query(
          `SELECT id FROM tracks ORDER BY random() LIMIT 10`
        );
        trackIds = tracks.rows.map((r: { id: number }) => r.id);
      }

      console.log(`${b.name}: ${recordIds.length} records, ${trackIds.length} tracks`);

      // Recommend
      const recRes = await client.query(
        `INSERT INTO features (number, name, description, category, bar, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`,
        [1, "Recommend", "Staff picks", "recommend", b.bar]
      );
      const recId = recRes.rows[0].id;
      const recCount = Math.min(8, recordIds.length);
      for (let i = 0; i < recCount; i++) {
        await client.query(
          `INSERT INTO feature_items (feature_id, item_id, item_type, number, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [recId, recordIds[i], "Record", i + 1]
        );
      }
      if (b.bar === 0) {
        for (let i = 0; i < Math.min(3, trackIds.length); i++) {
          await client.query(
            `INSERT INTO feature_items (feature_id, item_id, item_type, number, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())`,
            [recId, trackIds[i], "Track", recCount + i + 1]
          );
        }
      }
      console.log(`  Recommend (id=${recId})`);

      // New Arrival
      const newRes = await client.query(
        `INSERT INTO features (number, name, description, category, bar, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`,
        [2, "New Arrival", "Latest additions", "new_arrival", b.bar]
      );
      const newId = newRes.rows[0].id;
      const offset = recCount;
      const newCount = Math.min(7, recordIds.length - offset);
      for (let i = 0; i < newCount; i++) {
        await client.query(
          `INSERT INTO feature_items (feature_id, item_id, item_type, number, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [newId, recordIds[offset + i], "Record", i + 1]
        );
      }
      if (b.bar === 0 && trackIds.length > 3) {
        for (let i = 3; i < Math.min(6, trackIds.length); i++) {
          await client.query(
            `INSERT INTO feature_items (feature_id, item_id, item_type, number, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())`,
            [newId, trackIds[i], "Track", newCount + i - 2]
          );
        }
      }
      console.log(`  New Arrival (id=${newId})`);
    }

    console.log("Done!");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
