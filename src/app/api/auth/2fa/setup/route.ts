import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { generateSecret, generateURI } from 'otplib';

// POST /api/auth/2fa/setup — generate a new 2FA secret and return QR URI
export async function POST() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, twoFactorEnabled: true },
    });

    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    if (user.twoFactorEnabled) {
        return NextResponse.json({ message: '2FA is already enabled' }, { status: 400 });
    }


    const secret = generateSecret();

    // Store the secret temporarily (not enabled until verified)
    await prisma.user.update({
        where: { id: session.user.id },
        data: { twoFactorSecret: secret },
    });

    const otpauthUrl = generateURI({
        issuer: 'MarketX',
        label: user.email,
        secret,
    });

    return NextResponse.json({
        secret,
        otpauthUrl,
        message: 'Scan the QR code with your authenticator app, then verify with a code.',
    });
}

// DELETE /api/auth/2fa/setup — disable 2FA
export async function DELETE() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await prisma.user.update({
        where: { id: session.user.id },
        data: { twoFactorSecret: null, twoFactorEnabled: false },
    });

    return NextResponse.json({ message: '2FA disabled' });
}
