import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            twoFactorEnabled: true,
            image: true,
            subscriptionTier: true,
            subscriptionStatus: true,
        },
    });

    if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
}
