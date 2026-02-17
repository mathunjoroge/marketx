import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const createSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['CHECKING', 'SAVINGS', 'CREDIT', 'INVESTMENT', 'CASH']),
    balance: z.number().default(0),
    currency: z.string().default('USD'),
    institution: z.string().optional(),
});

export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const accounts = await prisma.bankAccount.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { transactions: true } }
            }
        });
        return NextResponse.json(accounts);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
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

        const account = await prisma.bankAccount.create({
            data: {
                userId: session.user.id!,
                ...result.data,
            }
        });
        return NextResponse.json(account, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
