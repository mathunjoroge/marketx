import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { alpacaBroker } from '@/lib/brokers/alpaca';
import type { TrailingStopRequest } from '@/lib/brokers/types';

/**
 * POST /api/trading/trailing-stop
 * Create a trailing stop order
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { symbol, qty, trail_percent, trail_price } = body;

        // Validate required fields
        if (!symbol || !qty) {
            return NextResponse.json(
                { error: 'Missing required fields: symbol, qty' },
                { status: 400 }
            );
        }

        // Must specify either trail_percent OR trail_price, not both
        if (!trail_percent && !trail_price) {
            return NextResponse.json(
                { error: 'Must specify either trail_percent or trail_price' },
                { status: 400 }
            );
        }

        if (trail_percent && trail_price) {
            return NextResponse.json(
                { error: 'Cannot specify both trail_percent and trail_price. Choose one.' },
                { status: 400 }
            );
        }

        // Validate trail_percent is reasonable (0.1% to 50%)
        if (trail_percent && (trail_percent < 0.1 || trail_percent > 50)) {
            return NextResponse.json(
                { error: 'trail_percent must be between 0.1 and 50' },
                { status: 400 }
            );
        }

        // Construct trailing stop request
        const trailingStopRequest: TrailingStopRequest = {
            symbol,
            qty: Number(qty),
            side: 'sell', // Trailing stops are always sell orders (to exit long positions)
            trail_percent: trail_percent ? Number(trail_percent) : undefined,
            trail_price: trail_price ? Number(trail_price) : undefined
        };

        // Submit trailing stop via Alpaca
        const order = await alpacaBroker.submitTrailingStop(trailingStopRequest);

        return NextResponse.json({
            success: true,
            order,
            message: 'Trailing stop order submitted successfully'
        });

    } catch (error: any) {
        console.error('Trailing stop error:', error);
        return NextResponse.json(
            {
                error: 'Failed to submit trailing stop order',
                details: error.message
            },
            { status: 500 }
        );
    }
}
