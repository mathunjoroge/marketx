/**
 * Redis-backed Rate Limiter
 * 
 * Implements sliding-window rate limiting for API endpoints.
 * Each key tracks the number of requests within a time window.
 */

import redis from './redis';
import logger from './logger';
import { apiError } from './api-helpers';
import { NextResponse } from 'next/server';

export interface RateLimitConfig {
    /** Maximum number of requests allowed within the window */
    limit: number;
    /** Time window in seconds */
    windowSec: number;
}

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number; // Unix timestamp when the window resets
}

/** Default rate limits for different endpoint categories */
export const RATE_LIMITS = {
    auth: { limit: 10, windowSec: 60 },          // 10 requests/minute for login/register
    trading: { limit: 30, windowSec: 60 },        // 30 requests/minute for order submission
    api: { limit: 100, windowSec: 60 },           // 100 requests/minute for general API
} as const;

/**
 * Check if a request is within the rate limit.
 * Uses Redis INCR + EXPIRE for atomic counting.
 * 
 * @param key Unique identifier (e.g., `ratelimit:auth:${ip}` or `ratelimit:trade:${userId}`)
 * @param config Rate limit configuration
 * @returns Result indicating if the request is allowed
 */
export async function checkRateLimit(
    key: string,
    config: RateLimitConfig = RATE_LIMITS.api
): Promise<RateLimitResult> {
    try {
        const redisKey = `ratelimit:${key}`;
        const count = await redis.incr(redisKey);

        if (count === 1) {
            // First request in this window — set expiry
            await redis.expire(redisKey, config.windowSec);
        }

        const ttl = await redis.ttl(redisKey);
        const resetAt = Math.floor(Date.now() / 1000) + ttl;

        return {
            allowed: count <= config.limit,
            remaining: Math.max(0, config.limit - count),
            resetAt,
        };
    } catch (error) {
        // If Redis is down, allow the request (fail-open)
        logger.warn('Rate limiter Redis error, failing open', { key, error });
        return { allowed: true, remaining: config.limit, resetAt: 0 };
    }
}

/**
 * Express-style rate limit check that returns a NextResponse if rate-limited.
 * Returns null if the request is allowed.
 */
export async function enforceRateLimit(
    key: string,
    config: RateLimitConfig = RATE_LIMITS.api
): Promise<NextResponse | null> {
    const result = await checkRateLimit(key, config);

    if (!result.allowed) {
        logger.warn('Rate limit exceeded', { key, resetAt: result.resetAt });
        return apiError('Too many requests. Please try again later.', 429);
    }

    return null;
}
