/** Defaults used for seeding and for labels not registered in the database yet. */
export const LABEL_DEFAULTS: Record<string, string> = {
  SITE_NAME: "MUSIC LIST",
  "NAV.popularCassettes": "Popular Cassettes",
  "SEARCH.noPopularCassettes": "No liked cassettes yet.",
  "NAV.allCassettes": "All Cassette List",
  "TOP_PAGE.viewAllCassettes": "View All Cassette",
  "POPUP.cassetteRequestEn": "To request this cassette, please show this screen to our staff. Please let us know whether you would like Side A or Side B.",
  "POPUP.cassetteRequestJa": "このカセットをリクエストする場合は、この画面をスタッフにご提示ください。あわせて、A面・B面のどちらをご希望かお伝えください。",
  "POPUP.cassetteSideA": "A面1曲目 / Side A, Track 1: ",
  "POPUP.cassetteSideB": "B面1曲目 / Side B, Track 1: ",
  "SEARCH.cassette": "Cassette",
  "SEARCH.cassettesLabel": "[ Cassettes ]",
  "SEARCH.noCassettes": "No cassettes found.",


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

export function resolveLabels(rows: Array<{ key: string; value: string }>) {
  const labels = new Map(Object.entries(LABEL_DEFAULTS));
  for (const { key, value } of rows) labels.set(key, value);
  return new Map([...labels].sort(([a], [b]) => a.localeCompare(b)));
}
