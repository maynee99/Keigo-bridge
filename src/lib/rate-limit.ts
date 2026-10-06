// Best-effort, in-memory limiter: each serverless instance keeps its own
// counts, so this slows down casual abuse but is not a hard cap. The hard cap
// on cost is the monthly spend limit set in the Anthropic Console.

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 10;

const hits = new Map<string, number[]>();

/** Returns true if this key may make another request now. */
export function allowRequest(key: string, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
