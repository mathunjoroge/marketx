import { NextRequest, NextResponse } from 'next/server';
import { getUserServices } from '@/lib/auth/credentials';
import { AssetClass } from '@/lib/providers/types';
import logger from '@/lib/logger';
import { calculateStackedEdge } from '@/lib/stackedEdge';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');
    const assetClass = (searchParams.get('assetClass') as AssetClass) || 'stock';
    const country = searchParams.get('country') || 'US';
    const history = searchParams.get('history') === 'true';
    const interval = searchParams.get('interval') || '240';
    const limit = parseInt(searchParams.get('limit') || '250');
    const includeStackedEdge = searchParams.get('stackedEdge') === 'true';

    // Get user-specific services
    const { marketData } = await getUserServices();

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
    }

    try {
        if (history) {
            const data = await marketData.getHistory(
                symbol as string,
                assetClass,
                interval as string,
                limit,
                country as string
            );
            return NextResponse.json(data);
        } else {
            const quote = await marketData.getQuote(
                symbol as string,
                assetClass,
                country as string
            );

            let stackedEdge = null;
            if (includeStackedEdge) {
                // Need at least 200 bars for SMA200
                const historicalData = await marketData.getHistory(
                    symbol as string,
                    assetClass,
                    '1d',
                    250,
                    country as string
                );
                stackedEdge = calculateStackedEdge(historicalData);
            }

            return NextResponse.json({
                ...quote,
                stackedEdge,
            });
        }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`API Error for ${symbol}: ${message}`);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
