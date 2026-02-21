import { NextRequest, NextResponse } from 'next/server';
import { getUserServices } from '@/lib/auth/credentials';
import { requireAuth } from '@/lib/api-helpers';

type RouteProps = {
    params: Promise<{
        orderId: string;
    }>;
};

/**
 * GET /api/trading/orders/[orderId]
 * Fetch a specific order by ID
 */
export async function GET(request: NextRequest, { params }: RouteProps) {
    try {
        const authResult = await requireAuth();
        if (authResult instanceof NextResponse) return authResult;

        const { alpaca } = await getUserServices();
        const { orderId } = await params;
        const order = await alpaca.getOrder(orderId);

        return NextResponse.json({
            success: true,
            order,
        });
    } catch (error: unknown) {
        console.error('Error fetching order:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch order';
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
 * DELETE /api/trading/orders/[orderId]
 * Cancel a specific order
 */
export async function DELETE(request: NextRequest, { params }: RouteProps) {
    try {
        const authResult = await requireAuth();
        if (authResult instanceof NextResponse) return authResult;

        const { alpaca } = await getUserServices();
        const { orderId } = await params;
        await alpaca.cancelOrder(orderId);

        return NextResponse.json({
            success: true,
            message: 'Order cancelled successfully',
        });
    } catch (error: unknown) {
        console.error('Error cancelling order:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to cancel order';
        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
            },
            { status: 500 }
        );
    }
}
