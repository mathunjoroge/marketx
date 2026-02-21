import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const trades = await prisma.trade.findMany({
        where: { userId: session.user.id },
        orderBy: { entryTime: 'desc' },
        take: 5,
        select: {
            id: true,
            symbol: true,
            side: true,
            qty: true,
            entryPrice: true,
            exitPrice: true,
            pnl: true,
            pnlPercent: true,
            status: true,
            entryTime: true,
            exitTime: true,
        },
    });

    return NextResponse.json(trades);
}
