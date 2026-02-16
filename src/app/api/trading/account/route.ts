import { NextRequest, NextResponse } from 'next/server';
import { getUserServices } from '@/lib/auth/credentials';
import { requireAuth, apiError, apiSuccess } from '@/lib/api-helpers';
import { getRedisClient } from '@/lib/redis';

/**
 * GET /api/trading/account
 * Fetch account information including cash, buying power, and portfolio value
 */
export async function GET(request: NextRequest) {
    try {
        // Require authentication
        const authResult = await requireAuth();
        if (authResult instanceof NextResponse) return authResult;

        const { alpaca } = await getUserServices();
        const redis = getRedisClient();
        const cacheKey = `trading:account:${authResult.userId}`;

        // Try to get from cache first (30 second TTL)
        if (redis) {
            try {
                const cached = await redis.get(cacheKey);
                if (cached) {
                    if (cached) {
                        const account = JSON.parse(cached);
                        return apiSuccess({ account, cached: true });
                    }
                }
            } catch {
                // Redis failure should not block the request
            }
        }

        // Fetch from Alpaca
        const account = await alpaca.getAccount();

        // Cache the result
        if (redis) {
            try {
                await redis.setex(cacheKey, 30, JSON.stringify(account));
            } catch {
                // Redis failure should not block the request
            }
        }

        return apiSuccess({ account });
    } catch (error: any) {
        console.error('Error fetching account:', error);
        return apiError(error.message || 'Failed to fetch account information');
    }
}
