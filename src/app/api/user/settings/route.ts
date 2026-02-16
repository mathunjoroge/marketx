import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const settingsSchema = z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    defaultRiskPercent: z.number().min(0.1).max(10).optional(),
});

export async function GET(req: Request) {
    const session = await auth();

    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const settings = await prisma.userSettings.findUnique({
            where: { userId: session.user.id },
        });

        return NextResponse.json(settings || { theme: 'dark', defaultRiskPercent: 1.0 });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();

    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const result = settingsSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ message: 'Invalid input', errors: result.error.issues }, { status: 400 });
        }

        const { theme, defaultRiskPercent } = result.data;

        const settings = await prisma.userSettings.upsert({
            where: { userId: session.user.id },
            update: {
                ...(theme && { theme }),
                ...(defaultRiskPercent !== undefined && { defaultRiskPercent }),
            },
            create: {
                userId: session.user.id!,
                theme: theme || 'dark',
                defaultRiskPercent: defaultRiskPercent || 1.0,
            },
        });

        return NextResponse.json({ message: 'Settings updated successfully', settings });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
