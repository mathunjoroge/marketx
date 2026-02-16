
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { calculatePerformanceMetrics, Trade } from '@/lib/trading/analytics';
import { alpacaBroker } from '@/lib/brokers/alpaca';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const userId = session.user.id;

        // Fetch closed trades
        const trades = await prisma.trade.findMany({
            where: {
                userId,
                status: 'CLOSED',
                exitTime: { not: null },
                pnl: { not: null }
            },
            orderBy: {
                exitTime: 'asc'
            }
        });

        // Map Prisma trades to Analytics Trade interface
        const analyticsTrades: Trade[] = trades.map(t => ({
            id: t.id,
            symbol: t.symbol,
            side: t.side as 'LONG' | 'SHORT',
            qty: t.qty,
            entryPrice: t.entryPrice,
            exitPrice: t.exitPrice!,
            entryTime: t.entryTime,
            exitTime: t.exitTime!,
            pnl: t.pnl!,
            exitReason: t.exitReason || undefined
        }));

        // Fetch current account equity
        // Ideally we get this from the broker or maintain a local ledger. 
        // For now, let's try to fetch from Alpaca if credentials exist, otherwise calculate from initial + pnl.
        let currentEquity = 100000; // Default fallback
        let initialEquity = 100000; // Default fallback

        try {
            const account = await alpacaBroker.getAccount();
            if (account) {
                currentEquity = parseFloat(account.equity);
                // Initial equity is hard to know without history, but we can approximate:
                // Current - Total PnL = Initial (roughly, ignoring deposits/withdrawals)
                const totalPnL = analyticsTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
                initialEquity = currentEquity - totalPnL;
            }
        } catch (error) {
            // console.warn('Failed to fetch Alpaca account for analytics', error);
            // Fallback: Start with 100k and add PnL
            const totalPnL = analyticsTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
            currentEquity = initialEquity + totalPnL;
        }

        const metrics = calculatePerformanceMetrics(
            analyticsTrades,
            initialEquity,
            currentEquity
        );

        return NextResponse.json(metrics);

    } catch (error) {
        console.error('Performance API Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
