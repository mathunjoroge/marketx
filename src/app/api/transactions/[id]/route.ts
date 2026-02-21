import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;

        const txn = await prisma.transaction.findUnique({
            where: { id, userId: session.user.id }
        });

        if (!txn) {
            return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
        }

        // Revert balance
        await prisma.$transaction([
            prisma.bankAccount.update({
                where: { id: txn.bankAccountId },
                data: { balance: { decrement: txn.amount } } // If amount was -50, decrementing -50 adds 50. Correct.
            }),
            prisma.transaction.delete({ where: { id } })
        ]);

        return NextResponse.json(null, { status: 204 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ message }, { status: 500 });
    }
}
