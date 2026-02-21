
import { POST } from '@/app/api/ai/advisor/route';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import redis from '@/lib/redis';

// Mock auth
jest.mock('@/auth');
const mockedAuth = auth as jest.Mock;

describe('AI Advisor API Integration', () => {
    const userId = 'test-user-id';

    beforeEach(async () => {
        await redis.flushall();
        mockedAuth.mockResolvedValue({ user: { id: userId } });

        // Ensure user exists with FREE tier
        await prisma.user.upsert({
            where: { id: userId },
            update: { subscriptionTier: 'FREE' },
            create: { id: userId, email: 'test@example.com', password: 'hashed', subscriptionTier: 'FREE' }
        });
    });

    it('should enforce rate limits for FREE tier', async () => {
        const req = new NextRequest('http://localhost/api/ai/advisor', { method: 'POST' });

        // Call 1-3 should succeed (FREE tier limit is 3)
        for (let i = 0; i < 3; i++) {
            const res = await POST(req as unknown as Request);
            expect(res.status).toBe(200);
            expect(res.headers.get('X-RateLimit-Remaining')).toBe((2 - i).toString());
        }

        // Call 4 should fail
        const res4 = await POST(req as unknown as Request);
        expect(res4.status).toBe(429);
        const data = await res4.json();
        expect(data.message).toContain('reached your daily limit');
    });
});
