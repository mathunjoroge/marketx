import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover',
    typescript: true,
});

export default stripe;

/**
 * Stripe Price IDs — these get created on first checkout if they don't exist.
 * In production you'd hardcode the IDs from the Stripe dashboard.
 */
export const PLAN_PRICES: Record<string, { name: string; amount: number; tier: string }> = {
    PREMIUM: { name: 'MarketX Premium', amount: 999, tier: 'PREMIUM' },
    PRO: { name: 'MarketX Pro', amount: 2999, tier: 'PRO' },
};
