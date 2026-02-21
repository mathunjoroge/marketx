import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const createSchema = z.object({
    name: z.string().min(1),
    targetAmount: z.number().positive(),
    currentAmount: z.number().min(0).default(0),
    deadline: z.string().datetime().optional(),
    category: z.string().optional(),
});

export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const goals = await prisma.goal.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
        });

        const enriched = goals.map(g => ({
            ...g,
            progress: Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100),
            remaining: Math.max(g.targetAmount - g.currentAmount, 0),
            isComplete: g.currentAmount >= g.targetAmount,
        }));

        return NextResponse.json(enriched);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const result = createSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ message: 'Invalid input', errors: result.error.issues }, { status: 400 });
        }

        const goal = await prisma.goal.create({
            data: {
                userId: session.user.id!,
                name: result.data.name,
                targetAmount: result.data.targetAmount,
                currentAmount: result.data.currentAmount,
                deadline: result.data.deadline ? new Date(result.data.deadline) : null,
                category: result.data.category,
            }
        });
        return NextResponse.json(goal, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message }, { status: 500 });
    }
}
