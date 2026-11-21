type Bucket = { count: number; resetAt: number };

type RateLimitStore = Map<string, Bucket>;

declare global {
  var __gymRateLimitStore: RateLimitStore | undefined;
}

const store = globalThis.__gymRateLimitStore ?? new Map<string, Bucket>();
if (process.env.NODE_ENV !== "production") globalThis.__gymRateLimitStore = store;

export const getClientIp = (request: Request) => {
  if (process.env.TRUST_PROXY !== "true") return "direct-client";
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
};

export const consumeRateLimit = (key: string, limit: number, windowMs: number) => {
  const now = Date.now();
  if (store.size > 1000) for (const [bucketKey, bucket] of store) if (bucket.resetAt <= now) store.delete(bucketKey);
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
};
