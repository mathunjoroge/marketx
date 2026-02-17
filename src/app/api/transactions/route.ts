import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const createTransactionSchema = z.object({
    amount: z.number(), // Negative for expense, positive for income? Or use type?
    category: z.string().min(1),
    description: z.string().min(1),
    type: z.enum(['INCOME', 'EXPENSE']),
    date: z.string().datetime().optional(), // ISO string
    bankAccountId: z.string().cuid(),
});

export async function GET(req: Request) {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    try {
        const transactions = await prisma.transaction.findMany({
            where: { userId: session.user.id },
            orderBy: { date: 'desc' },
            take: limit,
            include: { bankAccount: { select: { name: true, currency: true } } }
        });

        return NextResponse.json(transactions);
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
        const result = createTransactionSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ message: 'Invalid input', errors: result.error.issues }, { status: 400 });
        }

        const { amount, category, description, type, date, bankAccountId } = result.data;

        // Optimize: Use transaction to update balance and create record
        const txn = await prisma.$transaction(async (tx) => {
            const newTxn = await tx.transaction.create({
                data: {
                    userId: session.user.id!,
                    bankAccountId,
                    amount,
                    category,
                    description,
                    type,
                    date: date ? new Date(date) : new Date()
                }
            });

            // Update bank account balance
            // For EXPENSE, amount should be negative visually, but user might send positive.
            // Let's assume input amount is absolute and type determines sign?
            // Fintech logic was: sum + t.amount.
            // If type is EXPENSE, amount should probably be negative in DB for easier summing?
            // Or stored positive and we handle sign.
            // Fintech original code:
            // const monthlyExpenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
            // This suggests amount might be stored with sign or without.
            // Let's store signed amount for valid balance calculation.
            // If EXPENSE and amount > 0, make it negative.

            let finalAmount = amount;
            if (type === 'EXPENSE' && amount > 0) finalAmount = -amount;
            if (type === 'INCOME' && amount < 0) finalAmount = Math.abs(amount);

            // Wait, if I change amount, I should update the txn record too? 
            // Better to enforce in schema or just handle balance update.
            // Let's stick to: Amount in DB matches signed value.

            if (finalAmount !== amount) {
                await tx.transaction.update({
                    where: { id: newTxn.id },
                    data: { amount: finalAmount }
                });
            }

            await tx.bankAccount.update({
                where: { id: bankAccountId },
                data: {
                    balance: { increment: finalAmount }
                }
            });

            return newTxn;
        });

        return NextResponse.json(txn, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
