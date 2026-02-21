import { prisma } from './db/prisma';

export type SubscriptionTier = 'FREE' | 'PREMIUM' | 'PRO';

export interface TierConfig {
    aiCallLimit: number;
    watchlistLimit: number;
    hasAdvancedAnalytics: boolean;
    hasPremiumReports: boolean;
}

export const TIER_CONFIGS: Record<SubscriptionTier, TierConfig> = {
    FREE: {
        aiCallLimit: 3,
        watchlistLimit: 1,
        hasAdvancedAnalytics: false,
        hasPremiumReports: false,
    },
    PREMIUM: {
        aiCallLimit: 20,
        watchlistLimit: 5,
        hasAdvancedAnalytics: true,
        hasPremiumReports: false,
    },
    PRO: {
        aiCallLimit: 1000, // Effectively unlimited
        watchlistLimit: 100,
        hasAdvancedAnalytics: true,
        hasPremiumReports: true,
    },
};

/**
 * Get the current subscription tier of a user.
 */
export async function getUserSubscriptionTier(userId: string): Promise<SubscriptionTier> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionTier: true }
    });

    return (user?.subscriptionTier as SubscriptionTier) || 'FREE';
}

/**
 * Check if a user has access to a specific feature or limit.
 */
export async function checkFeatureAccess(
    userId: string,
    feature: keyof TierConfig
): Promise<boolean | number> {
    const tier = await getUserSubscriptionTier(userId);
    const config = TIER_CONFIGS[tier];
    return config[feature];
}
