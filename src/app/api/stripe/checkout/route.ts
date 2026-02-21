import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import stripe, { PLAN_PRICES } from '@/lib/stripe';
import logger from '@/lib/logger';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id!;
        const { plan } = await req.json();

        if (!plan || !PLAN_PRICES[plan]) {
            return NextResponse.json(
                { message: 'Invalid plan. Must be PREMIUM or PRO.' },
                { status: 400 }
            );
        }

        const planConfig = PLAN_PRICES[plan];

        // Get or create Stripe customer
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true, stripeCustomerId: true },
        });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        let customerId = user.stripeCustomerId;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name || undefined,
                metadata: { userId },
            });
            customerId = customer.id;

            await prisma.user.update({
                where: { id: userId },
                data: { stripeCustomerId: customerId },
            });
        }

        // Find or create the price in Stripe
        const prices = await stripe.prices.list({
            lookup_keys: [`marketx_${plan.toLowerCase()}_monthly`],
            active: true,
            limit: 1,
        });

        let priceId: string;

        if (prices.data.length > 0) {
            priceId = prices.data[0].id;
        } else {
            // Create product and price on the fly (for dev/test)
            const product = await stripe.products.create({
                name: planConfig.name,
                metadata: { tier: planConfig.tier },
            });

            const price = await stripe.prices.create({
                product: product.id,
                unit_amount: planConfig.amount,
                currency: 'usd',
                recurring: { interval: 'month' },
                lookup_key: `marketx_${plan.toLowerCase()}_monthly`,
            });

            priceId = price.id;
        }

        // Create checkout session
        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${process.env.NEXTAUTH_URL}/pricing?success=true&plan=${plan}`,
            cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
            metadata: { userId, plan: planConfig.tier },
            subscription_data: {
                metadata: { userId, plan: planConfig.tier },
            },
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Stripe Checkout Error: ${message}`);
        return NextResponse.json(
            { message: 'Failed to create checkout session', error: message },
            { status: 500 }
        );
    }
}
