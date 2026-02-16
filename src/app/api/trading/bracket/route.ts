import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { alpacaBroker } from '@/lib/brokers/alpaca';
import type { BracketOrderRequest } from '@/lib/brokers/types';

/**
 * POST /api/trading/bracket
 * Create a bracket order (entry + stop-loss + take-profit)
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
        const { symbol, qty, side, type, limit_price, take_profit, stop_loss, time_in_force } = body;

        // Validate required fields
        if (!symbol || !qty || !side || !take_profit || !stop_loss) {
            return NextResponse.json(
                { error: 'Missing required fields: symbol, qty, side, take_profit, stop_loss' },
                { status: 400 }
            );
        }

        // Validate take_profit and stop_loss structure
        if (!take_profit.limit_price) {
            return NextResponse.json(
                { error: 'take_profit must include limit_price' },
                { status: 400 }
            );
        }

        if (!stop_loss.stop_price) {
            return NextResponse.json(
                { error: 'stop_loss must include stop_price' },
                { status: 400 }
            );
        }

        // Validate price logic for long positions
        if (side === 'buy') {
            const entryPrice = limit_price || 0; // If market order, we'll validate after
            if (type === 'limit' && limit_price) {
                if (stop_loss.stop_price >= limit_price) {
                    return NextResponse.json(
                        { error: 'For buy orders: stop_loss price must be below entry price' },
                        { status: 400 }
                    );
                }
                if (take_profit.limit_price <= limit_price) {
                    return NextResponse.json(
                        { error: 'For buy orders: take_profit price must be above entry price' },
                        { status: 400 }
                    );
                }
            }
        }

        // Validate price logic for short positions
        if (side === 'sell') {
            if (type === 'limit' && limit_price) {
                if (stop_loss.stop_price <= limit_price) {
                    return NextResponse.json(
                        { error: 'For sell orders: stop_loss price must be above entry price' },
                        { status: 400 }
                    );
                }
                if (take_profit.limit_price >= limit_price) {
                    return NextResponse.json(
                        { error: 'For sell orders: take_profit price must be below entry price' },
                        { status: 400 }
                    );
                }
            }
        }

        // Construct bracket order request
        const bracketOrderRequest: BracketOrderRequest = {
            symbol,
            qty: Number(qty),
            side,
            type: type || 'market',
            limit_price: limit_price ? Number(limit_price) : undefined,
            time_in_force: time_in_force || 'gtc',
            take_profit: {
                limit_price: Number(take_profit.limit_price)
            },
            stop_loss: {
                stop_price: Number(stop_loss.stop_price),
                limit_price: stop_loss.limit_price ? Number(stop_loss.limit_price) : undefined
            }
        };

        // Submit bracket order via Alpaca
        const order = await alpacaBroker.submitBracketOrder(bracketOrderRequest);

        return NextResponse.json({
            success: true,
            order,
            message: 'Bracket order submitted successfully'
        });

    } catch (error: any) {
        console.error('Bracket order error:', error);
        return NextResponse.json(
            {
                error: 'Failed to submit bracket order',
                details: error.message
            },
            { status: 500 }
        );
    }
}
