/**
 * Seed the labels table with current hardcoded values from labels.ts
 *
 * Usage: npx tsx scripts/seed-labels.ts
 */

import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local", override: true });

import { Pool } from "pg";

const LABELS: Record<string, string> = {
  SITE_NAME: "MUSIC LIST",

  "BAR_NAMES.shinjuku": "SHINJUKU",
  "BAR_NAMES.ebisu": "EBISU",
  "BAR_NAMES.kagurazaka": "KAGURAZAKA",

  "NAV.top": "Top",
  "NAV.drinkMenu": "Drink Menu",
  "NAV.allRecords": "All Record List",
  "NAV.allHiRes": "All Hi-Res List",
  "NAV.popularRecords": "Popular Records",
  "NAV.popularHiRes": "Popular Hi-Res",
  "NAV.admin": "Admin",

  "TOP_PAGE.coverChargeEn1": "There\u2019s a 900yen cover charge per person,",
  "TOP_PAGE.coverChargeEn2": "and the following are complimentary.",
  "TOP_PAGE.coverChargeJa":
    "当店は900円のカバーチャージをいただいております。以下はサービスです。",
  "TOP_PAGE.snacksEn": "Snacks on the table",
  "TOP_PAGE.snacksJa": "テーブルスナック",
  "TOP_PAGE.songRequestEn": "1 Song Request",
  "TOP_PAGE.songRequestJa": "1曲リクエスト",
  "TOP_PAGE.viewAllRecords": "View All Record",
  "TOP_PAGE.viewAllHiRes": "View All Hi-Res",
  "TOP_PAGE.viewAll": "View All",

  "TABLE.title": "Title",
  "TABLE.artist": "Artist",
  "TABLE.albumArtist": "Album / Artist",
  "TABLE.artists": "Artists",
  "TABLE.albums": "Albums",

  "POPUP.recordRequestEn1":
    "To request a track from this record, please show this screen to our staff.",
  "POPUP.recordRequestEn2":
    "We will bring the record to you so you can choose one track.",
  "POPUP.recordRequestJa1":
    "このレコードからリクエストする場合はこの画面をスタッフにご提示ください。",
  "POPUP.recordRequestJa2":
    "レコードをお持ちしますのでそこから１曲お選びいただけます。",
  "POPUP.trackRequestEn":
    "To request this track, please show this screen to our staff.",
  "POPUP.trackRequestJa":
    "このトラックをリクエストする場合はこの画面をスタッフにご提示ください。",
  "POPUP.close": "Close",

  "SEARCH.placeholder": "Search",
  "SEARCH.searching": "Searching...",
  "SEARCH.noResults": "No results found.",
  "SEARCH.record": "Record",
  "SEARCH.hiRes": "Hi-Res",
  "SEARCH.artistLabel": "[ Artist ]",
  "SEARCH.all": "All",
  "SEARCH.noArtists": "No artists found.",
};

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    let created = 0;
    let skipped = 0;
    for (const [key, value] of Object.entries(LABELS)) {
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
