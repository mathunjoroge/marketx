import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const updateSchema = z.object({
    addAmount: z.number().positive().optional(),
    name: z.string().min(1).optional(),
    targetAmount: z.number().positive().optional(),
    deadline: z.string().datetime().nullable().optional(),
    category: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const existing = await prisma.goal.findFirst({
            where: { id, userId: session.user.id },
        });
        if (!existing) {
            return NextResponse.json({ message: 'Goal not found' }, { status: 404 });
        }

        const body = await req.json();
        const result = updateSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ message: 'Invalid input', errors: result.error.issues }, { status: 400 });
        }

        const { addAmount, ...updateData } = result.data;

        const goal = await prisma.goal.update({
            where: { id },
            data: {
                ...updateData,
                ...(addAmount ? { currentAmount: { increment: addAmount } } : {}),
                ...(updateData.deadline !== undefined ? { deadline: updateData.deadline ? new Date(updateData.deadline) : null } : {}),
            }
        });

        return NextResponse.json({
            ...goal,
            progress: Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100),
            remaining: Math.max(goal.targetAmount - goal.currentAmount, 0),
            isComplete: goal.currentAmount >= goal.targetAmount,
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const existing = await prisma.goal.findFirst({
            where: { id, userId: session.user.id },
        });
        if (!existing) {
            return NextResponse.json({ message: 'Goal not found' }, { status: 404 });
        }

        await prisma.goal.delete({ where: { id } });
        return NextResponse.json({ message: 'Deleted' });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message }, { status: 500 });
    }
}
