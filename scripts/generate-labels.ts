/**
 * Build-time script: reads labels from DB and generates src/lib/labels.ts
 *
 * Usage: npx tsx scripts/generate-labels.ts
 *
 * If no labels exist in DB yet, keeps the current labels.ts as-is.
 */

import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const LABELS_PATH = path.resolve(__dirname, "../src/lib/labels.ts");

// Group definitions matching the current labels.ts structure
const GROUPS: Array<
  | { exportName: string; type: "string"; key: string }
  | { exportName: string; type: "record"; prefix: string }
  | { exportName: string; type: "object"; prefix: string }
> = [
  { exportName: "SITE_NAME", type: "string", key: "SITE_NAME" },
  { exportName: "BAR_NAMES", type: "record", prefix: "BAR_NAMES." },
  { exportName: "NAV", type: "object", prefix: "NAV." },
  { exportName: "TOP_PAGE", type: "object", prefix: "TOP_PAGE." },
  { exportName: "TABLE", type: "object", prefix: "TABLE." },
  { exportName: "POPUP", type: "object", prefix: "POPUP." },
  { exportName: "SEARCH", type: "object", prefix: "SEARCH." },
];

function escapeStr(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

async function main() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
  });
  try {
    const { rows } = await pool.query<{ key: string; value: string }>(
      "SELECT key, value FROM labels ORDER BY key"
    );

    if (rows.length === 0) {
      console.log("No labels in DB – keeping existing labels.ts");
      return;
    }

    const map = new Map(rows.map((r) => [r.key, r.value]));

    const lines: string[] = [
      "/** User-facing labels – AUTO-GENERATED from DB. Do not edit manually. */",
      "",
    ];

    for (const group of GROUPS) {
      if (group.type === "string") {
        const val = map.get(group.key);
        if (val !== undefined) {
          lines.push(`export const ${group.exportName} = "${escapeStr(val)}";`);
        }
      } else if (group.type === "record") {
        const entries: [string, string][] = [];
        for (const [k, v] of map) {
          if (k.startsWith(group.prefix)) {
            entries.push([k.slice(group.prefix.length), v]);
          }
        }
        lines.push(
          `export const ${group.exportName}: Record<string, string> = {`
        );
        for (const [field, val] of entries) {
          lines.push(`  ${field}: "${escapeStr(val)}",`);
        }
        lines.push("};");
      } else {
        // object with as const
        const entries: [string, string][] = [];
        for (const [k, v] of map) {
          if (k.startsWith(group.prefix)) {
            entries.push([k.slice(group.prefix.length), v]);
          }
        }
        lines.push(`export const ${group.exportName} = {`);
        for (const [field, val] of entries) {
          lines.push(`  ${field}: "${escapeStr(val)}",`);
        }
        lines.push("} as const;");
      }
      lines.push("");
    }

    fs.writeFileSync(LABELS_PATH, lines.join("\n"));
    console.log(`Generated ${LABELS_PATH} with ${rows.length} labels`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("generate-labels failed:", e);
  process.exit(1);
});
