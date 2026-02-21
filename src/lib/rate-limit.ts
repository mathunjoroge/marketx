import redis from '@/lib/redis';
import logger from '@/lib/logger';

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
}

/**
 * Basic Token Bucket / Fixed Window rate limiter using Redis.
 * 
 * @param identifier Unique ID to rate limit (e.g., user ID or IP)
 * @param limit Maximum requests allowed in the window
 * @param windowSeconds Window size in seconds
 */
export async function rateLimit(
    identifier: string,
    limit: number,
    windowSeconds: number
): Promise<RateLimitResult> {
    const key = `ratelimit:${identifier}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - (now % windowSeconds);
    const windowEnd = windowStart + windowSeconds;

    try {
        const current = await redis.incr(key);

        if (current === 1) {
            await redis.expire(key, windowSeconds);
        }

        return {
            success: current <= limit,
            limit,
            remaining: Math.max(0, limit - current),
            reset: windowEnd,
        };
    } catch (error) {
        logger.error('Rate limit check failed', { identifier, error });
        // Fail open to avoid blocking users if Redis is down, but log it
        return {
            success: true,
            limit,
            remaining: limit,
            reset: windowEnd,
        };
    }
}

/**
 * Pre-configured rate limit profiles for common use-cases.
 */
export const RATE_LIMITS = {
    auth: { limit: 10, windowSeconds: 60 },
    trading: { limit: 30, windowSeconds: 60 },
    api: { limit: 60, windowSeconds: 60 },
};

/**
 * Convenience wrapper that returns a 429 NextResponse if the limit is exceeded,
 * or null if the request is allowed.
 */
export async function enforceRateLimit(
    identifier: string,
    config: { limit: number; windowSeconds: number }
): Promise<Response | null> {
    const result = await rateLimit(identifier, config.limit, config.windowSeconds);
    if (!result.success) {
        const { NextResponse } = await import('next/server');
        return NextResponse.json(
            { message: 'Too many requests. Please try again later.' },
            {
                status: 429,
                headers: {
                    'X-RateLimit-Limit': result.limit.toString(),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': result.reset.toString(),
                    'Retry-After': String(result.reset - Math.floor(Date.now() / 1000)),
                },
            }
        );
    }
    return null;
}
