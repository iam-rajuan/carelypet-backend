import { NextFunction, Request, Response } from "express";
import { AuthRequest } from "./auth.middleware";
import { deleteCacheByPrefix, getCache, getDefaultCacheTtlSeconds, setCache } from "../utils/cache";

const inFlight = new Map<string, Promise<unknown>>();

const toSortedQuery = (query: Request["query"]) =>
  Object.entries(query || {})
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((item) => [key, String(item)] as const);
      }
      if (value === undefined || value === null) return [];
      return [[key, String(value)] as const];
    })
    .sort(([a], [b]) => a.localeCompare(b));

const defaultKeyBuilder = (prefix: string, req: Request): string => {
  const authReq = req as AuthRequest;
  const userPart = authReq.user?.id ? `user:${authReq.user.id}` : "user:anon";
  const query = toSortedQuery(req.query)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return `${prefix}:${userPart}:${req.path}${query ? `?${query}` : ""}`;
};

export const cacheResponse =
  (prefix: string, ttlSeconds = getDefaultCacheTtlSeconds()) =>
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") return next();

    const key = defaultKeyBuilder(prefix, req);
    const cached = await getCache<unknown>(key);
    if (cached !== null) {
      res.setHeader("x-cache", "HIT");
      return res.json(cached);
    }

    const pending = inFlight.get(key);
    if (pending) {
      try {
        const shared = await pending;
        res.setHeader("x-cache", "HIT-COALESCED");
        return res.json(shared);
      } catch (_err) {
        // If the original request failed, fall through and handle this request normally.
      }
    }

    let resolveInFlight: (value: unknown) => void = () => undefined;
    let rejectInFlight: (reason?: unknown) => void = () => undefined;
    const inFlightPromise = new Promise<unknown>((resolve, reject) => {
      resolveInFlight = resolve;
      rejectInFlight = reject;
    });
    inFlight.set(key, inFlightPromise);

    res.setHeader("x-cache", "MISS");
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    res.json = ((body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        void setCache(key, body, ttlSeconds);
        resolveInFlight(body);
      } else {
        rejectInFlight(new Error(`status_${res.statusCode}`));
      }
      inFlight.delete(key);
      return originalJson(body);
    }) as Response["json"];

    res.send = ((body?: any) => {
      if (res.statusCode >= 400) {
        rejectInFlight(new Error(`status_${res.statusCode}`));
        inFlight.delete(key);
      }
      return originalSend(body);
    }) as Response["send"];

    return next();
  };

export const invalidateCacheOnSuccess =
  (...prefixes: string[]) =>
  (_req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = ((body: unknown) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        prefixes.forEach((prefix) => {
          void deleteCacheByPrefix(prefix);
        });
      }
      return originalJson(body);
    }) as Response["json"];

    next();
  };
