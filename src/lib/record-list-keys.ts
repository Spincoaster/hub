export type RecordListItemType = "Record" | "Hi-Res";

export function recordListItemKey(id: string | number | bigint, type: RecordListItemType): string {
  return `${type}:${String(id)}`;
}

export function recordLikeKey(id: string | number | bigint): string {
  return recordListItemKey(id, "Record");
}

export function trackLikeKey(id: string | number | bigint): string {
  return recordListItemKey(id, "Hi-Res");
}

export function assignRecordLikeCounts(
  target: Record<string, number>,
  counts: Record<string, number>,
) {
  for (const [id, count] of Object.entries(counts)) {
    target[recordLikeKey(id)] = count;
  }
}

export function assignTrackLikeCounts(
  target: Record<string, number>,
  counts: Record<string, number>,
) {
  for (const [id, count] of Object.entries(counts)) {
    target[trackLikeKey(id)] = count;
  }
}
