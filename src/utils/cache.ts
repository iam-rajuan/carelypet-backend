import { env } from "../env";

type CacheValue = {
  value: string;
  expiresAt: number;
};

const memoryStore = new Map<string, CacheValue>();
const cleanupIntervalMs = 60_000;
const cacheTtlSeconds = env.CACHE_TTL_SECONDS;

setInterval(() => {
  const now = Date.now();
  for (const [key, item] of memoryStore.entries()) {
    if (item.expiresAt <= now) {
      memoryStore.delete(key);
    }
  }
}, cleanupIntervalMs).unref();

export const getDefaultCacheTtlSeconds = (): number => cacheTtlSeconds;

export const getCache = async <T>(key: string): Promise<T | null> => {
  const item = memoryStore.get(key);
  if (!item) return null;
  if (item.expiresAt <= Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return JSON.parse(item.value) as T;
};

export const setCache = async <T>(key: string, value: T, ttlSeconds = cacheTtlSeconds) => {
  const payload = JSON.stringify(value);

  memoryStore.set(key, {
    value: payload,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
};

export const deleteCacheByPrefix = async (prefix: string) => {
  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix)) {
      memoryStore.delete(key);
    }
  }
};
