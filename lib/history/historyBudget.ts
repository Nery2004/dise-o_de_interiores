export function estimateSerializableBytes(value: unknown) {
  try {
    return JSON.stringify(value).length * 2;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

export function trimHistoryByEstimatedBytes<T>(history: T[], maxEntries: number, maxEstimatedBytes: number) {
  const kept: T[] = [];
  let bytes = 0;
  for (let index = history.length - 1; index >= 0 && kept.length < maxEntries; index -= 1) {
    const entry = history[index];
    const entryBytes = estimateSerializableBytes(entry);
    if (kept.length > 0 && bytes + entryBytes > maxEstimatedBytes) break;
    kept.unshift(entry);
    bytes += entryBytes;
  }
  return kept;
}
