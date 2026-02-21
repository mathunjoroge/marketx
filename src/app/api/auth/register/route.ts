import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db/prisma';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

// Validation schema
const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name is required').optional(),
});

export async function POST(request: NextRequest) {
    try {
        // Rate limit: 10 requests per minute per IP
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const rateLimited = await enforceRateLimit(`auth:register:${ip}`, RATE_LIMITS.auth);
        if (rateLimited) return rateLimited;

        const body = await request.json();
        const result = registerSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { message: 'Invalid input', errors: result.error.issues },
                { status: 400 }
            );
        }

        const { email, password, name } = result.data;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { message: 'User already exists' },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user with default settings
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || email.split('@')[0],
                settings: {
                    create: {
                        defaultRiskPercent: 1.0,
                        theme: 'dark',
                    }
                },
                watchlists: {
                    create: {
                        name: 'My First Watchlist',
                        symbols: ['AAPL', 'TSLA', 'SPY'],
                    }
                }
            },
        });

        // Remove password from response
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json(
            { message: 'User registered successfully', user: userWithoutPassword },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
