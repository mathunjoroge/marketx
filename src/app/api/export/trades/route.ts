import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

// GET /api/export/trades — export user's trades as CSV
export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    const trades = await prisma.trade.findMany({
        where: { userId: session.user.id },
        orderBy: { entryTime: 'desc' },
    });

    if (format === 'csv') {
        const headers = ['Symbol', 'Side', 'Status', 'Qty', 'Entry Price', 'Exit Price', 'P&L', 'P&L %', 'Entry Time', 'Exit Time', 'Exit Reason', 'Strategy', 'Tags', 'Rating', 'Notes'];
        const rows = trades.map(t => [
            t.symbol, t.side, t.status, t.qty, t.entryPrice, t.exitPrice ?? '',
            t.pnl ?? '', t.pnlPercent ?? '',
            t.entryTime.toISOString(), t.exitTime?.toISOString() ?? '',
            t.exitReason ?? '', t.strategy ?? '',
            (t.tags || []).join(';'), t.rating ?? '', (t.notes || '').replace(/,/g, ';'),
        ].join(','));

        const csv = [headers.join(','), ...rows].join('\n');
        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="trades_${new Date().toISOString().slice(0, 10)}.csv"`,
            },
        });
    }

    return NextResponse.json(trades);
}
