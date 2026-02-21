'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWatchlist } from '@/hooks/useWatchlist';
import Link from 'next/link';
import { ArrowRight, TrendingUp, TrendingDown, Clock } from 'lucide-react';

interface AssetPrice {
    price: number;
    change: number;
    changePercent: number;
    assetClass: string;
}

export default function DashboardWatchlist() {
    const { activeWatchlist } = useWatchlist();
    const [prices, setPrices] = useState<Record<string, AssetPrice>>({});
    // const [loading, setLoading] = useState(false);

    const fetchPrices = useCallback(async () => {
        if (!activeWatchlist?.symbols.length) return;

        try {
            const symbols = activeWatchlist.symbols.slice(0, 5); // Only show top 5
            const promises = symbols.map(async (sym: string) => {
                try {
                    const res = await fetch(`/api/market-data?symbol=${encodeURIComponent(sym)}`);
                    if (!res.ok) return null;
                    const data = await res.json();
                    return {
                        symbol: sym,
                        data: {
                            price: data.price,
                            change: data.change,
                            changePercent: data.changePercent,
                            assetClass: data.assetClass || 'stock'
                        }
                    };
                } catch {
                    return null;
                }
            });

            interface PriceResult {
                symbol: string;
                data: AssetPrice;
            }

            const results = await Promise.all(promises);
            const newPrices: Record<string, AssetPrice> = {};
            results.forEach((r: PriceResult | null) => {
                if (r) newPrices[r.symbol] = r.data;
            });
            setPrices(newPrices);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(errorMessage);
        }
    }, [activeWatchlist]);

    useEffect(() => {
        let isStopped = false;

        const initFetch = async () => {
            if (!isStopped) {
                await fetchPrices();
            }
        };

        initFetch();
        const interval = setInterval(fetchPrices, 30000);
        return () => {
            isStopped = true;
            clearInterval(interval);
        };
    }, [fetchPrices]);

    if (!activeWatchlist || activeWatchlist.symbols.length === 0) {
        return (
            <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-6 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-white font-bold mb-1">Your Watchlist is Empty</h3>
                <p className="text-gray-400 text-sm mb-4">Add assets to track them here</p>
                <Link
                    href="/market"
                    className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    Browse Markets
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2">
                    {activeWatchlist.name}
                    <span className="px-2 py-0.5 rounded-full bg-gray-700 text-xs text-gray-400 font-normal">
                        {activeWatchlist.symbols.length}
                    </span>
                </h3>
                <Link href="/watchlist" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    View All <ArrowRight className="w-3 h-3" />
                </Link>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm">
                    <thead className="text-gray-500 bg-gray-900/30">
                        <tr>
                            <th className="px-4 py-2 text-left font-medium">Symbol</th>
                            <th className="px-4 py-2 text-right font-medium">Price</th>
                            <th className="px-4 py-2 text-right font-medium">Change</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/30">
                        {activeWatchlist.symbols.slice(0, 5).map((symbol: string) => {
                            const data = prices[symbol];
                            const isPositive = data?.change >= 0;

                            return (
                                <tr key={symbol} className="hover:bg-gray-700/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <Link href={`/asset/${symbol}`} className="font-bold text-white hover:text-blue-400 block">
                                            {symbol}
                                        </Link>
                                        <div className="text-xs text-gray-500 uppercase">{data?.assetClass || '---'}</div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="text-gray-200 font-mono">
                                            {data ? `$${data.price.toFixed(2)}` : '---'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {data ? (
                                            <div className={`flex items-center justify-end gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                <span>{Math.abs(data.changePercent).toFixed(2)}%</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-600">---</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
