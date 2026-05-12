import type { RepoAnalysis } from "@/types/planner";

interface CacheEntry {
  analysis: RepoAnalysis;
  truncated: boolean;
  cachedAt: number;
  ttl: number;
}

const store = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.cachedAt > entry.ttl) {
      store.delete(key);
    }
  }
}, 60_000);

export function getCachedAnalysis(
  cacheKey: string
): { analysis: RepoAnalysis; truncated: boolean } | null {
  const entry = store.get(cacheKey);
  if (!entry) return null;

  const age = Date.now() - entry.cachedAt;
  if (age > entry.ttl) {
    store.delete(cacheKey);
    return null;
  }

  return { analysis: entry.analysis, truncated: entry.truncated };
}

export function setCachedAnalysis(
  cacheKey: string,
  analysis: RepoAnalysis,
  truncated: boolean,
  ttl?: number
): void {
  store.set(cacheKey, {
    analysis,
    truncated,
    cachedAt: Date.now(),
    ttl: ttl ?? DEFAULT_TTL_MS
  });
}

export function invalidateCache(cacheKey: string): void {
  store.delete(cacheKey);
}
