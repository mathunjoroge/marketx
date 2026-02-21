import { NextRequest, NextResponse } from 'next/server';
import { getUserServices } from '@/lib/auth/credentials';
import { requireAuth, apiSuccess } from '@/lib/api-helpers';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import type { OrderRequest } from '@/lib/brokers/types';

/**
 * POST /api/trading/orders
 * Submit a new order
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth();
        if (authResult instanceof NextResponse) return authResult;

        // Rate limit: 30 order submissions per minute per user
        const userId = (authResult as { userId: string }).userId;
        const rateLimited = await enforceRateLimit(`trading:orders:${userId}`, RATE_LIMITS.trading);
        if (rateLimited) return rateLimited;

        const { alpaca } = await getUserServices();
        const body = await request.json();

        // Validate required fields
        if (!body.symbol) {
            return NextResponse.json(
                { success: false, error: 'Symbol is required' },
                { status: 400 }
            );
        }

        if (!body.qty || body.qty <= 0) {
            return NextResponse.json(
                { success: false, error: 'Quantity must be greater than 0' },
                { status: 400 }
            );
        }

        if (!['buy', 'sell'].includes(body.side)) {
            return NextResponse.json(
                { success: false, error: 'Side must be either "buy" or "sell"' },
                { status: 400 }
            );
        }

        if (!['market', 'limit'].includes(body.type)) {
            return NextResponse.json(
                { success: false, error: 'Type must be either "market" or "limit"' },
                { status: 400 }
            );
        }

        // Validate limit price for limit orders
        if (body.type === 'limit' && (!body.limit_price || body.limit_price <= 0)) {
            return NextResponse.json(
                { success: false, error: 'Limit price is required for limit orders' },
                { status: 400 }
            );
        }

        // Check buying power for buy orders
        if (body.side === 'buy') {
            const account = await alpaca.getAccount();
            const buyingPower = parseFloat(account.buying_power);

            // Rough estimate - for market orders, we can't know exact price
            // For limit orders, we can check against limit price
            if (body.type === 'limit') {
                const estimatedCost = body.qty * body.limit_price;
                if (estimatedCost > buyingPower) {
                    return NextResponse.json(
                        {
                            success: false,
                            error: 'Insufficient buying power',
                            details: {
                                required: estimatedCost.toFixed(2),
                                available: buyingPower.toFixed(2)
                            }
                        },
                        { status: 400 }
                    );
                }
            }
        }

        // Construct order request
        const orderRequest: OrderRequest = {
            symbol: body.symbol.toUpperCase(),
            qty: parseInt(body.qty),
            side: body.side,
            type: body.type,
            time_in_force: body.time_in_force || 'gtc',
            limit_price: body.limit_price ? parseFloat(body.limit_price) : undefined,
            extended_hours: body.extended_hours || false,
        };

        // Submit order to Alpaca
        const order = await alpaca.submitOrder(orderRequest);

        return apiSuccess({
            order,
            message: `${body.type.toUpperCase()} ${body.side.toUpperCase()} order submitted successfully`,
        });
    } catch (error: unknown) {
        console.error('Error submitting order:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to submit order';
        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/trading/orders
 * Fetch order history
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth();
        if (authResult instanceof NextResponse) return authResult;

        const { alpaca } = await getUserServices();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as 'open' | 'closed' | 'all' || 'all';
        const limit = parseInt(searchParams.get('limit') || '100');

        const orders = await alpaca.getOrders({ status, limit });

        return apiSuccess({ orders });
    } catch (error: unknown) {
        console.error('Error fetching orders:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch orders';
        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
            },
            { status: 500 }
        );
    }
}
