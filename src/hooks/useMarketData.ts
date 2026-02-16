import { useState, useEffect, useCallback } from 'react';
import { useMarket } from '@/context/MarketContext';

interface MarketDataConfig {
    interval?: string;       // E.g., '1d', '240' (4h), '60'
    stackedEdge?: boolean;   // Whether to include StackedEdge analysis
    pollInterval?: number;   // In milliseconds (default: 60000)
    subscribeDetails?: boolean; // If true, fetches full details (quote + history + indicators)
}

export function useMarketData(
    symbol: string,
    assetClass: string,
    options: MarketDataConfig = {}
) {
    const { country } = useMarket();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const {
        interval = '240', // Default 4h
        stackedEdge = true,
        pollInterval = 60000 // Default 1 min
    } = options;

    const fetchData = useCallback(async () => {
        if (!symbol) return;

        try {
            // Build query params
            const params = new URLSearchParams({
                symbol,
                assetClass,
                country: country || 'US',
                interval,
            });

            if (stackedEdge) {
                params.append('stackedEdge', 'true');
            }

            const res = await fetch(`/api/market-data?${params.toString()}`);

            if (!res.ok) {
                throw new Error(`Failed to fetch market data: ${res.statusText}`);
            }

            const json = await res.json();
            setData(json);
            setError(null);
        } catch (err: any) {
            console.error('Market data fetch error:', err);
            setError(err.message || 'Error fetching market data');
        } finally {
            setLoading(false);
        }
    }, [symbol, assetClass, country, interval, stackedEdge]);

    useEffect(() => {
        fetchData();

        if (pollInterval > 0) {
            const intervalId = setInterval(fetchData, pollInterval);
            return () => clearInterval(intervalId);
        }
    }, [fetchData, pollInterval]);

    return { data, loading, error, refetch: fetchData };
}
