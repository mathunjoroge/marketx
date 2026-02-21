import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import stripe from '@/lib/stripe';
import logger from '@/lib/logger';

export async function POST() {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id!;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { stripeCustomerId: true },
        });

        if (!user?.stripeCustomerId) {
            return NextResponse.json(
                { message: 'No active subscription found.' },
                { status: 400 }
            );
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${process.env.NEXTAUTH_URL}/pricing`,
        });

        return NextResponse.json({ url: portalSession.url });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Stripe Portal Error: ${message}`);
        return NextResponse.json(
            { message: 'Failed to create portal session', error: message },
            { status: 500 }
        );
    }
}
