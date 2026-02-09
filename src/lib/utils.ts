/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Recursively convert BigInt values to strings for JSON serialization.
 */
export function serializeBigInt<T>(data: T): T {
  if (data === null || data === undefined) return data;
  if (typeof data === "bigint") return data.toString() as unknown as T;
  if (Array.isArray(data)) return data.map(serializeBigInt) as unknown as T;
  if (data instanceof Date) return data as unknown as T;
  if (typeof data === "object") {
    const result: Record<string, any> = {};
    for (const key in data) {
      result[key] = serializeBigInt((data as Record<string, any>)[key]);
    }
    return result as T;
  }
  return data;
}

/**
 * Bar value mapping: Rails stores bar as integer in DB.
 */
export const BAR_VALUES: Record<string, number> = {
  shinjuku: 0,
  ebisu: 1,
  kagurazaka: 2,
};

/**
 * Build a prefix filter condition for Prisma queries.
 * Uses phoneticName for alphabet prefixes, furigana for Japanese prefixes.
 */
export function buildPrefixFilter(hasPrefix: string) {
  const isAlphabet = /^[a-zA-Z]$/.test(hasPrefix);
  if (isAlphabet) {
    return { phoneticName: { startsWith: hasPrefix.toLowerCase() } };
  }
  return { furigana: { startsWith: hasPrefix } };
}
