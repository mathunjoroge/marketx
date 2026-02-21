import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import stripe from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';
import logger from '@/lib/logger';
import type Stripe from 'stripe';

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    // If no webhook secret configured, handle via checkout.session metadata
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
        if (webhookSecret && signature) {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } else {
            // For local development without webhook signing
            event = JSON.parse(body) as Stripe.Event;
            logger.warn('Stripe webhook received without signature verification (dev mode)');
        }
    } catch (err: any) {
        logger.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.metadata?.userId;
                const plan = session.metadata?.plan;

                if (userId && plan) {
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            subscriptionTier: plan,
                            subscriptionStatus: 'ACTIVE',
                            subscriptionId: session.subscription as string,
                            stripeCustomerId: session.customer as string,
                        },
                    });
                    logger.info(`User ${userId} upgraded to ${plan}`);
                }
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata?.userId;

                if (userId) {
                    const status = subscription.status === 'active' ? 'ACTIVE' : 'INACTIVE';
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            subscriptionStatus: status,
                            subscriptionId: subscription.id,
                        },
                    });
                    logger.info(`Subscription updated for user ${userId}: ${subscription.status}`);
                }
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata?.userId;

                if (userId) {
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            subscriptionTier: 'FREE',
                            subscriptionStatus: 'FREE',
                            subscriptionId: null,
                        },
                    });
                    logger.info(`Subscription cancelled for user ${userId}, reverted to FREE`);
                }
                break;
            }

            default:
                logger.info(`Unhandled Stripe event: ${event.type}`);
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Webhook handler error: ${message}`);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
