/**
 * Simple in-memory rate limiter.
 * Catatan: Ini bersifat volatile di environment serverless (per-instance).
 * Untuk produksi skala besar, gunakan Redis (Upstash) atau sejenisnya.
 */

const cache = new Map<string, { count: number; expires: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = cache.get(key);

  if (!entry || entry.expires < now) {
    cache.set(key, { count: 1, expires: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count += 1;
  return { success: true, remaining: limit - entry.count };
}

/**
 * Mendapatkan IP client dari request.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "127.0.0.1";
}
