import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import mysql from "mysql2/promise";
import { Pool } from "pg";

const MYSQL_URL = process.env.MYSQL_DATABASE_URL!;
const PG_URL = process.env.DATABASE_URL!;

// Tables in dependency order (parents before children)
const TABLES = [
  {
    name: "admins",
    columns: ["id", "name", "password_digest", "created_at", "updated_at"],
  },
  {
    name: "artists",
    columns: [
      "id",
      "name",
      "phonetic_name",
      "furigana",
      "created_at",
      "updated_at",
    ],
  },
  {
    name: "bars",
    columns: ["id", "name", "created_at", "updated_at"],
  },
  {
    name: "owners",
    columns: ["id", "name", "created_at", "updated_at"],
  },
  {
    name: "albums",
    columns: [
      "id",
      "name",
      "phonetic_name",
      "furigana",
      "artist_id",
      "created_at",
      "updated_at",
    ],
  },
  {
    name: "features",
    columns: [
      "id",
      "number",
      "name",
      "description",
      "external_link",
      "external_thumbnail",
      "category",
      "created_at",
      "updated_at",
    ],
  },
  {
    name: "news_entries",
    columns: [
      "id",
      "news_id",
      "title",
      "url",
      "published_at",
      "content",
      "thumbnail",
      "created_at",
      "updated_at",
    ],
  },
  {
    name: "records",
    columns: [
      "id",
      "name",
      "phonetic_name",
      "furigana",
      "location",
      "number",
      "comment",
      "artist_id",
      "owner_id",
      "created_at",
      "updated_at",
      "bar",
    ],
  },
  {
    name: "tracks",
    columns: [
      "id",
      "name",
      "phonetic_name",
      "furigana",
      "number",
      "artist_id",
      "album_id",
      "created_at",
      "updated_at",
    ],
  },
  {
    name: "feature_items",
    columns: [
      "id",
      "feature_id",
      "item_id",
      "item_type",
      "number",
      "comment",
      "created_at",
      "updated_at",
    ],
  },
];

async function migrate() {
  console.log("Connecting to MySQL...");
  const mysqlConn = await mysql.createConnection({ uri: MYSQL_URL });

  console.log("Connecting to PostgreSQL...");
  const pg = new Pool({ connectionString: PG_URL });

  for (const table of TABLES) {
    console.log(`\nMigrating: ${table.name}`);

    // Read from MySQL (skip if table doesn't exist)
    let data: Record<string, unknown>[];
    try {
      const [rows] = await mysqlConn.query(
        `SELECT ${table.columns.join(", ")} FROM ${table.name}`
      );
      data = rows as Record<string, unknown>[];
    } catch (err: unknown) {
      const mysqlErr = err as { code?: string };
      if (mysqlErr.code === "ER_NO_SUCH_TABLE") {
        console.log(`  Skipped (table not found in MySQL)`);
        continue;
      }
      throw err;
    }
    console.log(`  Found ${data.length} rows`);

    if (data.length === 0) continue;

    // Clear existing data in PostgreSQL
    await pg.query(`DELETE FROM ${table.name}`);

    // Batch insert
    const batchSize = 500;
    let inserted = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const placeholders: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      for (const row of batch) {
        const rowPlaceholders: string[] = [];
        for (const col of table.columns) {
          rowPlaceholders.push(`$${paramIndex++}`);
          values.push(row[col] ?? null);
        }
        placeholders.push(`(${rowPlaceholders.join(", ")})`);
      }

      const sql = `INSERT INTO ${table.name} (${table.columns.join(", ")}) VALUES ${placeholders.join(", ")} ON CONFLICT DO NOTHING`;
      await pg.query(sql, values);
      inserted += batch.length;
      process.stdout.write(`  Inserted ${inserted}/${data.length}\r`);
    }
    console.log(`  Inserted ${inserted}/${data.length} rows`);

    // Reset sequence to max id
    const result = await pg.query(
      `SELECT COALESCE(MAX(id), 0) as max_id FROM ${table.name}`
    );
    const maxId = result.rows[0].max_id;
    if (maxId > 0) {
      await pg.query(
        `SELECT setval(pg_get_serial_sequence('${table.name}', 'id'), $1)`,
        [maxId]
      );
      console.log(`  Sequence reset to ${maxId}`);
    }
  }

  await mysqlConn.end();
  await pg.end();
  console.log("\nMigration complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
