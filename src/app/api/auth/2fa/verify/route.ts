import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { verify } from 'otplib';

// POST /api/auth/2fa/verify — verify a TOTP code to enable 2FA
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await request.json();
    if (!code || typeof code !== 'string') {
        return NextResponse.json({ message: 'Code is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
    if (!user.twoFactorSecret) {
        return NextResponse.json({ message: 'Run 2FA setup first' }, { status: 400 });
    }


    const result = await verify({ token: code, secret: user.twoFactorSecret });
    const isValid = typeof result === 'object' && result !== null && 'valid' in result ? (result as any).valid : result === true;

    if (!isValid) {
        return NextResponse.json({ message: 'Invalid code' }, { status: 400 });
    }

    if (!user.twoFactorEnabled) {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { twoFactorEnabled: true },
        });
    }

    return NextResponse.json({ message: '2FA verified and enabled', enabled: true });
}
