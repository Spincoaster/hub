import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { Pool } from "pg";

const PG_URL = process.env.POSTGRES_URL!;

const BARS = [
  { bar: 0, name: "Shinjuku" },
  { bar: 1, name: "Ebisu" },
  { bar: 2, name: "Kagurazaka" },
];

const FEATURES = [
  { name: "Recommend", number: 1 },
  { name: "New Arrival", number: 2 },
];

async function seed() {
  const pg = new Pool({ connectionString: PG_URL });

  for (const b of BARS) {
    for (const f of FEATURES) {
      // Skip if already exists
      const existing = await pg.query(
        "SELECT id FROM features WHERE name = $1 AND bar = $2",
        [f.name, b.bar],
      );
      if (existing.rows.length > 0) {
        console.log(`  Skip: ${b.name} - ${f.name} (already exists)`);
        continue;
      }

      await pg.query(
        "INSERT INTO features (name, number, bar, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW())",
        [f.name, f.number, b.bar],
      );
      console.log(`  Created: ${b.name} - ${f.name}`);
    }
  }

  await pg.end();
  console.log("\nSeed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
