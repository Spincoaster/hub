/**
 * Seed the labels table with current hardcoded values from labels.ts
 *
 * Usage: npx tsx scripts/seed-labels.ts
 */

import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { Pool } from "pg";

import { LABEL_DEFAULTS } from "../src/lib/label-defaults";

async function main() {
  const url = process.env.POSTGRES_URL ?? "";
  const pool = new Pool({
    connectionString: url + (url.includes("?") ? "&" : "?") + "uselibpqcompat=true",
  });
  try {
    let created = 0;
    let skipped = 0;
    for (const [key, value] of Object.entries(LABEL_DEFAULTS)) {
      const res = await pool.query(
        `INSERT INTO labels (key, value, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         ON CONFLICT (key) DO NOTHING`,
        [key, value]
      );
      if (res.rowCount && res.rowCount > 0) {
        created++;
      } else {
        skipped++;
      }
    }
    console.log(
      `Seeded labels: ${created} created, ${skipped} already existed`
    );
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("seed-labels failed:", e);
  process.exit(1);
});
