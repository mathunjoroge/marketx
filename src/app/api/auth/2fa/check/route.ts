import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

// POST /api/auth/2fa/check — check if user needs 2FA
export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                password: true,
                twoFactorEnabled: true,
                status: true // Check if active
            },
        });

        if (!user) {
            // Return false to avoid username enumeration (or handle generically)
            // In a high-security context, we might rely on timing, but here we'll just say no 2FA needed 
            // and let the actual login fail.
            return NextResponse.json({ require2fa: false });
        }

        // Check password first to avoid leaking 2FA status for wrong passwords
        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) {
            return NextResponse.json({ require2fa: false });
        }

        if (user.status !== 'ACTIVE') {
            return NextResponse.json({ require2fa: false }); // Login will fail anyway
        }

        return NextResponse.json({ require2fa: user.twoFactorEnabled });

    } catch (error) {
        console.error('2FA Check Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
