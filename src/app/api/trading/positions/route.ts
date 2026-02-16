import { NextRequest, NextResponse } from 'next/server';
import { getUserServices } from '@/lib/auth/credentials';
import { requireAuth, apiError, apiSuccess } from '@/lib/api-helpers';

/**
 * GET /api/trading/positions
 * Fetch all open positions
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth();
        if (authResult instanceof NextResponse) return authResult;

        const { alpaca } = await getUserServices();
        const positions = await alpaca.getPositions();

        return apiSuccess({ positions });
    } catch (error: any) {
        console.error('Error fetching positions:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to fetch positions',
            },
            { status: 500 }
        );
    }
}
