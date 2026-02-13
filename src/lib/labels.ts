/** User-facing labels (admin pages are excluded) */

export const SITE_NAME = "MUSIC LIST";

export const BAR_NAMES: Record<string, string> = {
  shinjuku: "SHINJUKU",
  ebisu: "EBISU",
  kagurazaka: "KAGURAZAKA",
};

// Navigation
export const NAV = {
  top: "Top",
  drinkMenu: "Drink Menu",
  allRecords: "All Record List",
  allHiRes: "All Hi-Res List",
  popularRecords: "Popular Records",
  popularHiRes: "Popular Hi-Res",
  admin: "Admin",
} as const;

// Bar top page
export const TOP_PAGE = {
  coverChargeEn1: "There\u2019s a 900yen cover charge per person,",
  coverChargeEn2: "and the following are complimentary.",
  coverChargeJa: "当店は900円のカバーチャージをいただいております。以下はサービスです。",
  snacksEn: "Snacks on the table",
  snacksJa: "テーブルスナック",
  songRequestEn: "1 Song Request",
  songRequestJa: "1曲リクエスト",
  viewAllRecords: "View All Record",
  viewAllHiRes: "View All Hi-Res",
  viewAll: "View All",
} as const;

// Table headers
export const TABLE = {
  title: "Title",
  artist: "Artist",
  albumArtist: "Album / Artist",
  artists: "Artists",
  albums: "Albums",
} as const;

// Record popup
export const POPUP = {
  recordRequestEn1: "To request a track from this record, please show this screen to our staff.",
  recordRequestEn2: "We will bring the record to you so you can choose one track.",
  recordRequestJa1: "このレコードからリクエストする場合はこの画面をスタッフにご提示ください。",
  recordRequestJa2: "レコードをお持ちしますのでそこから１曲お選びいただけます。",
  trackRequestEn: "To request this track, please show this screen to our staff.",
  trackRequestJa: "このトラックをリクエストする場合はこの画面をスタッフにご提示ください。",
  close: "Close",
} as const;

// Search
export const SEARCH = {
  placeholder: "Search",
  searching: "Searching...",
  noResults: "No results found.",
  record: "Record",
  hiRes: "Hi-Res",
  artistLabel: "[ Artist ]",
  all: "All",
  noArtists: "No artists found.",
} as const;
