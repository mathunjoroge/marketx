import { NextResponse } from 'next/server';
import { getUserServices } from '@/lib/auth/credentials';
import { requireAuth, apiSuccess } from '@/lib/api-helpers';

/**
 * GET /api/trading/positions
 * Fetch all open positions
 */
export async function GET() {
    try {
        const authResult = await requireAuth();
        if (authResult instanceof NextResponse) return authResult;

        const { alpaca } = await getUserServices();
        const positions = await alpaca.getPositions();

        return apiSuccess({ positions });
    } catch (error: unknown) {
        console.error('Error fetching positions:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch positions';
        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
            },
            { status: 500 }
        );
    }
}
