/** Pure Gmail history cursor parser; NEVER uses credentials or calls external APIs. */
export function normalizeHistoryId(value) {
  if (typeof value !== 'string' || !/^[1-9][0-9]*$/.test(value)) throw new TypeError('Invalid Gmail historyId');
  return BigInt(value).toString();
}
export function selectNextHistoryId(current, incoming) {
  const next = normalizeHistoryId(incoming);
  if (current === undefined || current === null) return next;
  const previous = normalizeHistoryId(current);
  return BigInt(next) > BigInt(previous) ? next : previous;
}
