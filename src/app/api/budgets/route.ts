import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const createBudgetSchema = z.object({
    category: z.string().min(1),
    amount: z.number().positive(),
    period: z.enum(['MONTHLY', 'WEEKLY', 'YEARLY']).default('MONTHLY'),
});

export async function GET(req: Request) {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const budgets = await prisma.budget.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' }
        });

        // Enrich with spent amount (simplified for now, mimicking fintech logic)
        const enrichedBudgets = await Promise.all(budgets.map(async (budget) => {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const result = await prisma.transaction.aggregate({
                _sum: { amount: true },
                where: {
                    userId: session.user.id,
                    category: budget.category,
                    date: { gte: startOfMonth },
                    // In markets, we might use type 'EXPENSE' or negative amount. 
                    // Assuming 'EXPENSE' type exists from migration.
                    type: 'EXPENSE'
                }
            });

            const spent = Math.abs(result._sum.amount || 0);
            const progress = Math.min(Math.round((spent / budget.amount) * 100), 100);

            return { ...budget, spent, progress };
        }));

        return NextResponse.json(enrichedBudgets);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const result = createBudgetSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ message: 'Invalid input', errors: result.error.issues }, { status: 400 });
        }

        const { category, amount, period } = result.data;

        const budget = await prisma.budget.create({
            data: {
                userId: session.user.id!,
                category,
                amount,
                period
            }
        });

        return NextResponse.json(budget, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
