import { NextRequest } from 'next/server';

/**
 * Simple in-memory rate limiter
 * For production with multiple instances, consider using Redis-based rate limiting
 * (e.g., @upstash/ratelimit with @upstash/redis)
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
    /**
     * Maximum number of requests allowed within the window
     */
    maxRequests: number;

    /**
     * Time window in seconds
     */
    windowSeconds: number;

    /**
     * Custom identifier function (defaults to IP address)
     */
    identifier?: (req: NextRequest) => string;
}

/**
 * Rate limiting middleware
 * 
 * @example
 * ```ts
 * const limiter = rateLimit({ maxRequests: 5, windowSeconds: 60 });
 * const result = limiter(request);
 * if (!result.success) {
 *   return NextResponse.json(
 *     { error: 'Too many requests' },
 *     { status: 429, headers: result.headers }
 *   );
 * }
 * ```
 */
export function rateLimit(config: RateLimitConfig) {
    const { maxRequests, windowSeconds, identifier } = config;

    return (req: NextRequest) => {
        // Get identifier (IP address by default)
        const id = identifier
            ? identifier(req)
            : req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

        const now = Date.now();
        const windowMs = windowSeconds * 1000;
        const key = `${id}`;

        // Get or create rate limit entry
        let entry = rateLimitStore.get(key);

        if (!entry || entry.resetTime < now) {
            // Create new entry or reset expired entry
            entry = {
                count: 1,
                resetTime: now + windowMs,
            };
            rateLimitStore.set(key, entry);

            return {
                success: true,
                headers: {
                    'X-RateLimit-Limit': maxRequests.toString(),
                    'X-RateLimit-Remaining': (maxRequests - 1).toString(),
                    'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
                },
            };
        }

        // Increment count
        entry.count++;

        const remaining = Math.max(0, maxRequests - entry.count);
        const headers = {
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
        };

        if (entry.count > maxRequests) {
            // Rate limit exceeded
            return {
                success: false,
                headers: {
                    ...headers,
                    'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
                },
            };
        }

        return {
            success: true,
            headers,
        };
    };
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimiters = {
    /**
     * Strict rate limit for authentication endpoints
     * 5 requests per minute
     */
    auth: rateLimit({ maxRequests: 5, windowSeconds: 60 }),

    /**
     * Moderate rate limit for API endpoints
     * 30 requests per minute
     */
    api: rateLimit({ maxRequests: 30, windowSeconds: 60 }),

    /**
     * Lenient rate limit for public endpoints
     * 100 requests per minute
     */
    public: rateLimit({ maxRequests: 100, windowSeconds: 60 }),
};
