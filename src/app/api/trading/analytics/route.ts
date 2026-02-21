import { NextResponse } from 'next/server';
import { getUserServices } from '@/lib/auth/credentials';
import { requireAuth } from '@/lib/api-helpers';
import {
    calculatePerformanceMetrics,
    buildEquityCurve,
    type Trade,
} from '@/lib/trading/analytics';

export async function GET() {
    try {
        // Require authentication
        const authResult = await requireAuth();
        if (authResult instanceof NextResponse) return authResult;

        // Get user-specific services
        const { alpaca } = await getUserServices();

        // Fetch account to get initial and current equity
        const account = await alpaca.getAccount();
        const currentEquity = parseFloat(account.equity);

        // For paper trading, the initial equity is typically the starting balance
        // In production, this should be stored in a database
        const initialEquity = 100000; // Default paper trading amount

        // Fetch order history
        const orders = await alpaca.getOrders({
            status: 'closed',
            limit: 500,
            direction: 'desc',
        });

        // Convert orders to trades format
        // Note: This is a simplified conversion. In production, you'd want to:
        // 1. Match buy/sell pairs to calculate actual P&L per trade
        // 2. Store trades in a database for more accurate tracking
        const trades: Trade[] = orders
            .filter(order => order.filled_at && order.filled_avg_price && order.filled_qty)
            .map(order => {
                const filledPrice = parseFloat(order.filled_avg_price ?? '0');
                const qty = parseFloat(order.filled_qty ?? '0');

                // For now, estimate P&L based on current positions
                // In production, match buy/sell pairs for exact P&L
                const profit = 0;

                return {
                    id: order.id,
                    symbol: order.symbol,
                    side: order.side === 'buy' ? 'LONG' : 'SHORT',
                    qty: qty,
                    entryPrice: filledPrice,
                    exitPrice: filledPrice,
                    entryTime: order.filled_at!,
                    exitTime: order.filled_at!,
                    pnl: profit,
                };
            });

        // Get current positions to calculate unrealized P&L
        const positions = await alpaca.getPositions();
        const totalUnrealizedPL = positions.reduce(
            (sum, pos) => sum + parseFloat(pos.unrealized_pl),
            0
        );

        // Calculate metrics
        const metrics = calculatePerformanceMetrics(
            trades,
            initialEquity,
            currentEquity
        );

        // Build equity curve
        const equityCurve = buildEquityCurve(trades, initialEquity);

        // Add current point to equity curve
        if (equityCurve.length > 0) {
            equityCurve.push({
                date: new Date().toISOString().split('T')[0],
                equity: currentEquity,
            });
        } else {
            // No trades yet, just show initial and current
            equityCurve.push(
                {
                    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .split('T')[0],
                    equity: initialEquity,
                },
                {
                    date: new Date().toISOString().split('T')[0],
                    equity: currentEquity,
                }
            );
        }

        return NextResponse.json({
            success: true,
            metrics: {
                ...metrics,
                currentEquity,
                initialEquity,
                unrealizedPL: totalUnrealizedPL,
            },
            equityCurve,
            recentTrades: trades.slice(0, 10), // Last 10 trades
        });
    } catch (error: unknown) {
        console.error('Error fetching analytics:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
            },
            { status: 500 }
        );
    }
}
