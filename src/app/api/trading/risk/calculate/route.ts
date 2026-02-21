import { NextResponse } from 'next/server';
import { requireAuth, apiError, parseNumeric } from '@/lib/api-helpers';
import {
    calculatePositionSize,
    calculateRiskReward,
    getRecommendedPositionSize,
    type PositionSizeResult,
    type RiskRewardResult,
} from '@/lib/trading/risk';

export async function POST(request: Request) {
    try {
        // Require authentication
        const authResult = await requireAuth();
        if (authResult instanceof NextResponse) return authResult;

        const body = await request.json();

        const accountValue = parseNumeric(body.accountValue);
        const buyingPower = parseNumeric(body.buyingPower);
        const entryPrice = parseNumeric(body.entryPrice);
        const stopPrice = parseNumeric(body.stopPrice);
        const targetPrice = parseNumeric(body.targetPrice);
        const riskPercent = parseNumeric(body.riskPercent);

        // Validate required fields
        if (!accountValue || !entryPrice) {
            return apiError('Account value and entry price are required (must be valid numbers)', 400);
        }

        if (accountValue <= 0 || entryPrice <= 0) {
            return apiError('Account value and entry price must be positive numbers', 400);
        }

        const response: Record<string, unknown> = {
            success: true,
        };

        // Calculate position size if stop price is provided
        if (stopPrice) {
            if (stopPrice <= 0) {
                return apiError('Stop price must be a positive number', 400);
            }

            try {
                const positionSize: PositionSizeResult = calculatePositionSize(
                    accountValue,
                    riskPercent || 1,
                    entryPrice,
                    stopPrice
                );

                response.positionSize = positionSize;

                // If buying power provided, get recommended size with validation
                if (buyingPower) {
                    const recommended = getRecommendedPositionSize(
                        accountValue,
                        buyingPower,
                        entryPrice,
                        stopPrice,
                        riskPercent ?? undefined
                    );
                    response.recommended = recommended;
                }
            } catch (error: unknown) {
                response.positionSizeError = error instanceof Error ? error.message : 'Unknown error';
            }
        }

        // Calculate risk/reward if both stop and target are provided
        if (stopPrice && targetPrice) {
            if (targetPrice <= 0) {
                return apiError('Target price must be a positive number', 400);
            }

            try {
                const riskReward: RiskRewardResult = calculateRiskReward(
                    entryPrice,
                    stopPrice,
                    targetPrice
                );
                response.riskReward = riskReward;
            } catch (error: unknown) {
                response.riskRewardError = error instanceof Error ? error.message : 'Unknown error';
            }
        }

        return NextResponse.json(response);
    } catch (error: unknown) {
        console.error('Error calculating risk:', error);
        return apiError(error instanceof Error ? error.message : 'Failed to calculate risk');
    }
}
