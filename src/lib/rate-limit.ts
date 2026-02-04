/**
 * Simple in-memory rate limiter
 * In production, use Redis or similar for distributed rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 60000); // Clean every minute

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Check rate limit for a given identifier
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = identifier;

  let entry = store.get(key);

  // Create new entry if none exists or window has expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
  }

  entry.count++;
  store.set(key, entry);

  const remaining = Math.max(0, config.maxRequests - entry.count);
  const success = entry.count <= config.maxRequests;

  return {
    success,
    remaining,
    resetAt: new Date(entry.resetAt),
  };
}

/**
 * Get rate limit identifier from request
 * Uses IP address with fallback
 */
export function getRateLimitIdentifier(request: Request): string {
  // Try various headers for the real IP
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback (won't work well in production behind a proxy)
  return "unknown";
}

// Preset configurations
export const RATE_LIMITS = {
  // Application submission: 3 per hour per IP
  application: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
  },
  // Presign requests: 10 per 10 minutes per IP
  presign: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 10,
  },
  // Email verification: 5 per hour per email
  emailVerification: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
  },
} as const;
