import Redis from 'ioredis';
import logger from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// ── Primary Redis client (always initialized for caching) ───────────────
const redis = new Redis(redisUrl);

redis.on('error', (err) => {
    logger.warn('Redis connection issue, caching may be disabled', { error: err.message });
});

export default redis;

// ── Pub/Sub clients (lazy-initialized on first use) ─────────────────────
let _pub: Redis | null = null;
let _sub: Redis | null = null;

function createRedisClient(name: string): Redis {
    const client = new Redis(redisUrl);
    client.on('error', (err) => {
        logger.warn(`Redis ${name} connection issue`, { error: err.message });
    });
    return client;
}

/** Get the Redis publisher client. Created on first call. */
export function getPub(): Redis {
    if (!_pub) {
        _pub = createRedisClient('pub');
    }
    return _pub;
}

/** Get the Redis subscriber client. Created on first call. */
export function getSub(): Redis {
    if (!_sub) {
        _sub = createRedisClient('sub');
    }
    return _sub;
}

// Backward-compatible named exports (lazy getters via Proxy-like pattern)
// These are used by ws.ts and potentially other modules.
// We keep direct exports for the pub/sub to maintain API compat,
// but they now trigger lazy initialization.
export const pub = new Proxy({} as Redis, {
    get(_, prop) {
        return (getPub() as unknown as Record<string | symbol, unknown>)[prop];
    }
});

export const sub = new Proxy({} as Redis, {
    get(_, prop) {
        return (getSub() as unknown as Record<string | symbol, unknown>)[prop];
    }
});

// ── Caching utilities ───────────────────────────────────────────────────
export const CACHE_TTL = 60 * 5; // 5 minutes for historical data

export async function getCachedData<T>(key: string): Promise<T | null> {
    try {
        const data = await redis.get(key);
        if (!data) return null;
        return JSON.parse(data);
    } catch (error) {
        logger.warn('Redis cache read failed', { key, error });
        return null;
    }
}

export async function setCachedData<T>(key: string, data: T, ttl = CACHE_TTL): Promise<void> {
    try {
        await redis.set(key, JSON.stringify(data), 'EX', ttl);
    } catch (error) {
        logger.warn('Redis cache write failed', { key, error });
    }
}

export function getRedisClient() {
    return redis;
}

// ── Health check ────────────────────────────────────────────────────────
export async function isRedisHealthy(): Promise<boolean> {
    try {
        const result = await redis.ping();
        return result === 'PONG';
    } catch {
        return false;
    }
}
