export const CASSETTE_SHEET = "神楽坂カセットテープリスト";
export const CASSETTE_BAR = 2;

const HEADERS = ["場所", "番号", "所有者", "タイトル", "アーティスト", "A面１曲目", "B面１曲目", "コメント"];
const clean = (value: unknown) => String(value ?? "").replace(/[\r\n\t]+/g, " ").trim();

export function parseCassetteSheet(rows: unknown[][]) {
  if (!HEADERS.every((header, i) => clean(rows[0]?.[i]) === header)) {
    throw new Error("カセットシートの列構成が想定と異なります。同期を中止しました。");
  }
  const items: Array<{
    location: string; number: number; name: string; artistName: string;
    ownerName: string; sideAFirstTrack: string | null; sideBFirstTrack: string | null;
    comment: string | null;
  }> = [];
  const skippedRows: number[] = [];
  const keys = new Set<string>();
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i].map(clean);
    if (!cells.some(Boolean)) continue;
    const [location, numberText, ownerName, name, artistName, sideA, sideB, comment] = cells;
    const number = Number(numberText);
    if (!location || !name || !artistName || !/^\d+$/.test(numberText ?? "") || !Number.isSafeInteger(number) || number < 1 || number > 2147483647) {
      skippedRows.push(i + 1);
      continue;
    }
    const key = `${location}:${number}`;
    if (keys.has(key)) throw new Error(`場所・番号が重複しています: ${key}（${i + 1}行）。同期を中止しました。`);
    keys.add(key);
    items.push({ location, number, name, artistName, ownerName: ownerName ?? "", sideAFirstTrack: sideA || null, sideBFirstTrack: sideB || null, comment: comment || null });
  }
  if (items.length === 0) throw new Error("有効なカセットが0件のため、同期を中止しました。");
  return { items, skippedRows };
}
