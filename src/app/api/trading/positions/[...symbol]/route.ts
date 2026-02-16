import { NextRequest, NextResponse } from 'next/server';
import { getUserServices } from '@/lib/auth/credentials';
import { requireAuth, apiError, apiSuccess } from '@/lib/api-helpers';

type RouteProps = {
    params: Promise<{
        symbol: string[];
    }>;
};

/**
 * GET /api/trading/positions/[symbol]
 * Fetch a specific position by symbol
 */
export async function GET(request: NextRequest, { params }: RouteProps) {
    try {
        const authResult = await requireAuth();
        if (authResult instanceof NextResponse) return authResult;

        const { alpaca } = await getUserServices();
        const { symbol: symbolParts } = await params;
        const symbol = symbolParts.join('/');
        const position = await alpaca.getPosition(symbol);

        if (!position) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Position not found',
                },
                { status: 404 }
            );
        }

        return apiSuccess({ position });
    } catch (error: any) {
        console.error('Error fetching position:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to fetch position',
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/trading/positions/[symbol]
 * Close a specific position
 */
export async function DELETE(request: NextRequest, { params }: RouteProps) {
    try {
        const authResult = await requireAuth();
        if (authResult instanceof NextResponse) return authResult;

        const { alpaca } = await getUserServices();
        const { symbol: symbolParts } = await params;
        const symbol = symbolParts.join('/');
        const { searchParams } = new URL(request.url);

        // Optional: Close partial position
        const qty = searchParams.get('qty');
        const percentage = searchParams.get('percentage');

        const closeRequest: any = { symbol };

        if (qty) {
            closeRequest.qty = parseInt(qty);
        } else if (percentage) {
            closeRequest.percentage = parseInt(percentage);
        }

        const order = await alpaca.closePosition(closeRequest);

        return apiSuccess({
            order,
            message: `Position ${symbol} closed successfully`,
        });
    } catch (error: any) {
        console.error('Error closing position:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to close position',
            },
            { status: 500 }
        );
    }
}
