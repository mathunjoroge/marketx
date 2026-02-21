
import { prisma } from '../src/lib/db/prisma';
import { rateLimit } from '../src/lib/rate-limit';
import { getUserSubscriptionTier, TIER_CONFIGS } from '../src/lib/subscription';
import redis from '../src/lib/redis';

async function testMonetization() {
    console.log('--- Testing Monetization Logic ---');

    // 1. Setup Test User
    const testEmail = 'monetize-test@example.com';
    const user = await prisma.user.upsert({
        where: { email: testEmail },
        update: { subscriptionTier: 'FREE' },
        create: {
            email: testEmail,
            name: 'Monetize Test',
            password: 'hashed_password',
            subscriptionTier: 'FREE'
        }
    });

    console.log(`Test User created/updated: ${user.email}, Tier: ${user.subscriptionTier}`);

    // 2. Clear Redis for this user
    await redis.del(`ratelimit:ai-advisor:${user.id}`);
    console.log('Cleared rate limit bucket in Redis.');

    // 3. Test FREE tier limits (Limit = 3)
    console.log('\nTesting FREE tier limit (3 calls per day)...');
    const freeConfig = TIER_CONFIGS['FREE'];
    for (let i = 1; i <= 4; i++) {
        const res = await rateLimit(`ai-advisor:${user.id}`, freeConfig.aiCallLimit, 86400);
        console.log(`Call ${i}: Success=${res.success}, Remaining=${res.remaining}`);
        if (i === 4 && !res.success) {
            console.log('PASS: Correctly blocked 4th call on FREE tier.');
        }
    }

    // 4. Upgrade User to PRO
    console.log('\nUpgrading user to PRO tier...');
    await prisma.user.update({
        where: { id: user.id },
        data: { subscriptionTier: 'PRO' }
    });

    const newTier = await getUserSubscriptionTier(user.id);
    const proConfig = TIER_CONFIGS[newTier];
    console.log(`User Tier updated to: ${newTier}, New Limit: ${proConfig.aiCallLimit}`);

    // 5. Test PRO tier limits (Should succeed where FREE failed)
    // We don't reset Redis here to see if the NEW limit is respected even with existing usage
    console.log('Testing PRO tier usage (should succeed since limit is high)...');
    const resPro = await rateLimit(`ai-advisor:${user.id}`, proConfig.aiCallLimit, 86400);
    console.log(`Call after upgrade: Success=${resPro.success}, Remaining=${resPro.remaining}`);

    if (resPro.success) {
        console.log('PASS: PRO user correctly allowed more calls than FREE user.');
    }

    // Cleanup
    // await prisma.user.delete({ where: { id: user.id } });
}

testMonetization()
    .catch(console.error)
    .finally(() => process.exit(0));
