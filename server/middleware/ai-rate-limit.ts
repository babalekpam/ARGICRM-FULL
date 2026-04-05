/**
 * ARGILETTE — AI RATE LIMITER
 *
 * Per-tenant sliding-window rate limiter for all AI routes.
 * Uses in-memory buckets — lightweight, zero dependencies.
 * Limits enforced: per-minute (hard), per-hour (soft warn).
 */

import { Request, Response, NextFunction } from "express";
import { RATE_LIMITS } from "../services/ai-credits.js";
import type { AuthRequest } from "./auth.js";

// Minute-level: Map<tenantId, { count, windowStart }>
const minuteBuckets = new Map<string, { count: number; windowStart: number }>();
// Hour-level: Map<tenantId, { count, windowStart }>
const hourBuckets   = new Map<string, { count: number; windowStart: number }>();
// Day-level:  Map<tenantId, { count, windowStart }>
const dayBuckets    = new Map<string, { count: number; windowStart: number }>();

function tick(
  map: Map<string, { count: number; windowStart: number }>,
  key: string,
  windowMs: number
): number {
  const now = Date.now();
  const bucket = map.get(key);

  if (!bucket || now - bucket.windowStart >= windowMs) {
    map.set(key, { count: 1, windowStart: now });
    return 1;
  }

  bucket.count++;
  return bucket.count;
}

// Purge stale entries every 10 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of minuteBuckets) if (now - v.windowStart > 60_000)    minuteBuckets.delete(k);
  for (const [k, v] of hourBuckets)   if (now - v.windowStart > 3_600_000) hourBuckets.delete(k);
  for (const [k, v] of dayBuckets)    if (now - v.windowStart > 86_400_000) dayBuckets.delete(k);
}, 600_000);

export function aiRateLimit(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthRequest;
  const tenantId = authReq.user?.tenantId;
  const plan     = (authReq.user as any)?.plan || "starter";

  // Skip rate limiting for platform owner / enterprise
  if (authReq.user?.role === "platform_owner" || authReq.user?.role === "super_admin") {
    return next();
  }

  if (!tenantId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const limits = RATE_LIMITS[plan] || RATE_LIMITS.starter;

  const perMin  = tick(minuteBuckets, tenantId, 60_000);
  const perHour = tick(hourBuckets,   tenantId, 3_600_000);
  const perDay  = tick(dayBuckets,    tenantId, 86_400_000);

  if (perMin > limits.perMinute) {
    res.status(429).json({
      error: "Rate limit exceeded",
      detail: `Max ${limits.perMinute} AI requests per minute on the ${plan} plan. Please wait a moment.`,
      retryAfter: 60,
    });
    return;
  }

  if (perHour > limits.perHour) {
    res.status(429).json({
      error: "Rate limit exceeded",
      detail: `Max ${limits.perHour} AI requests per hour on the ${plan} plan.`,
      retryAfter: 3600,
    });
    return;
  }

  if (perDay > limits.perDay) {
    res.status(429).json({
      error: "Rate limit exceeded",
      detail: `Daily AI limit reached (${limits.perDay} requests on the ${plan} plan). Resets at midnight.`,
      retryAfter: 86400,
    });
    return;
  }

  next();
}
