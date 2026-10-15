export class CassetteInputError extends Error {}

export type CassetteInput = {
  name?: string;
  location?: string;
  number?: number;
  phoneticName?: string | null;
  furigana?: string | null;
  sideAFirstTrack?: string | null;
  sideBFirstTrack?: string | null;
  comment?: string | null;
  artistId?: bigint | null;
  ownerId?: bigint | null;
};

export function parseCassetteInput(value: unknown, create = false) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CassetteInputError("入力内容が不正です。");
  const body = value as Record<string, unknown>;
  if (body.bar !== undefined && body.bar !== 2 && body.bar !== "kagurazaka") throw new CassetteInputError("カセットは神楽坂店のみ対応しています。");
  const data: CassetteInput = {};
  for (const key of ["name", "location"] as const) {
    if (create || body[key] !== undefined) {
      if (typeof body[key] !== "string" || !body[key].trim()) throw new CassetteInputError(key === "name" ? "タイトルを入力してください。" : "場所を入力してください。");
      data[key] = body[key].trim();
    }
  }
  if (create || body.number !== undefined) {
    if (typeof body.number !== "number" || !Number.isInteger(body.number) || body.number < 1 || body.number > 2147483647) throw new CassetteInputError("番号は1以上の整数で入力してください。");
    data.number = body.number;
  }
  for (const key of ["phoneticName", "furigana", "sideAFirstTrack", "sideBFirstTrack", "comment"] as const) {
    if (body[key] !== undefined) {
      if (body[key] !== null && typeof body[key] !== "string") throw new CassetteInputError("文字列を入力してください。");
      data[key] = typeof body[key] === "string" ? body[key].trim() || null : null;
    }
  }
  for (const key of ["artistId", "ownerId"] as const) {
    const id = body[key];
    if (id === undefined) continue;
    if (id === null || id === "") { data[key] = null; continue; }
    if (!((typeof id === "string" && /^\d+$/.test(id)) || (typeof id === "number" && Number.isSafeInteger(id))) || BigInt(id) < BigInt(1) || BigInt(id) > BigInt("9223372036854775807")) throw new CassetteInputError("アーティスト・所有者の指定が不正です。");
    data[key] = BigInt(id);
  }
  const scoreDelta = body.scoreDelta;
  if (scoreDelta !== undefined && (typeof scoreDelta !== "number" || !Number.isInteger(scoreDelta) || scoreDelta < -2147483648 || scoreDelta > 2147483647)) throw new CassetteInputError("ランキング補正は整数で入力してください。");
  return { data, scoreDelta: scoreDelta as number | undefined };
}

export function cassetteWriteError(error: unknown): { error: string; status: number } | null {
  if (error instanceof CassetteInputError) return { error: error.message, status: 400 };
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : null;
  if (code === "P2002") return { error: "同じ場所・番号のカセットが既にあります。", status: 409 };
  if (code === "P2003") return { error: "指定したアーティストまたは所有者が見つかりません。", status: 400 };
  if (code === "P2025") return { error: "カセットが見つかりません。", status: 404 };
  return null;
}
