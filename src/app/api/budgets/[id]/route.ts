import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // In Next.js 15+, params is a Promise
) {
    const session = await auth();
    if (!session || !session.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id } = await params;

        // Ensure user owns the budget
        const count = await prisma.budget.count({
            where: { id, userId: session.user.id }
        });

        if (count === 0) {
            return NextResponse.json({ message: 'Budget not found' }, { status: 404 });
        }

        await prisma.budget.delete({
            where: { id }
        });

        return NextResponse.json(null, { status: 204 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
