'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingDown, BarChart3, DollarSign, Target, Shield } from 'lucide-react';
import { PerformanceMetrics, Trade } from '@/lib/trading/analytics';

interface AnalyticsProps {
    className?: string;
}

export default function PortfolioAnalytics({ className = '' }: AnalyticsProps) {
    interface AnalyticsResponse {
        metrics?: PerformanceMetrics;
        recentTrades?: Trade[];
    }

    const [data, setData] = useState<AnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = useCallback(async () => {
        try {
            const res = await fetch('/api/trading/analytics');
            const json: AnalyticsResponse = await res.json(); // Cast to AnalyticsResponse
            if (json) { // Assuming success is implied by data presence or handled by API
                setData(json);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [fetchAnalytics]);

    if (loading) {
        return (
            <div className={`bg-[#161b22] border border-gray-800 rounded-2xl p-8 ${className}`}>
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-800 rounded w-1/4"></div>
                    <div className="space-y-3">
                        <div className="h-20 bg-gray-800 rounded"></div>
                        <div className="h-20 bg-gray-800 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    const metrics = data?.metrics;

    return (
        <div className={`bg-[#161b22] border border-gray-800 rounded-2xl p-6 ${className}`}>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-indigo-400" />
                Portfolio Analytics
            </h2>

            {/* Performance Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Total Return */}
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400 uppercase tracking-wide">Total Return</span>
                        <DollarSign className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className={`text-2xl font-bold mb-1 ${metrics?.totalReturn && metrics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {metrics?.totalReturn && metrics.totalReturn >= 0 ? '+' : ''}${metrics?.totalReturn?.toFixed(2) || '0.00'}
                    </div>
                    <div className={`text-sm ${metrics?.totalReturnPercent && metrics.totalReturnPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {metrics?.totalReturnPercent && metrics.totalReturnPercent >= 0 ? '+' : ''}{metrics?.totalReturnPercent?.toFixed(2) || '0.00'}%
                    </div>
                </div>

                {/* Sharpe Ratio */}
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400 uppercase tracking-wide">Sharpe Ratio</span>
                        <Target className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="text-2xl font-bold text-indigo-400 mb-1">
                        {metrics?.sharpeRatio?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-xs text-gray-500">
                        {(metrics?.sharpeRatio || 0) > 1 ? 'Good' : (metrics?.sharpeRatio || 0) > 2 ? 'Excellent' : 'Fair'} risk-adjusted returns
                    </div>
                </div>

                {/* Max Drawdown */}
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400 uppercase tracking-wide">Max Drawdown</span>
                        <TrendingDown className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-400 mb-1">
                        -{metrics?.maxDrawdownPercent?.toFixed(2) || '0.00'}%
                    </div>
                    <div className="text-xs text-gray-500">
                        -${metrics?.maxDrawdown?.toFixed(2) || '0.00'}
                    </div>
                </div>

                {/* Win Rate */}
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400 uppercase tracking-wide">Win Rate</span>
                        <Shield className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-400 mb-1">
                        {metrics?.winRate?.toFixed(1) || '0.0'}%
                    </div>
                    <div className="text-xs text-gray-500">
                        {metrics?.winningTrades || 0}W / {metrics?.losingTrades || 0}L
                    </div>
                </div>
            </div>

            {/* Trade Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Statistics */}
                <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wide">Trade Statistics</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Total Trades</span>
                            <span className="text-sm font-bold text-white">{metrics?.totalTrades || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Average Win</span>
                            <span className="text-sm font-bold text-green-400">+${metrics?.avgWin?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Average Loss</span>
                            <span className="text-sm font-bold text-red-400">-${metrics?.avgLoss?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Profit Factor</span>
                            <span className="text-sm font-bold text-indigo-400">
                                {metrics?.profitFactor === Infinity ? '∞' : metrics?.profitFactor?.toFixed(2) || '0.00'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-gray-800 pt-3">
                            <span className="text-sm text-gray-400">Expectancy</span>
                            <span className={`text-sm font-bold ${metrics?.expectancy && metrics.expectancy >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ${metrics?.expectancy?.toFixed(2) || '0.00'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Equity Summary */}
                <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wide">Account Summary</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Starting Equity</span>
                            <span className="text-sm font-bold text-white">${metrics?.initialEquity?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Current Equity</span>
                            <span className="text-sm font-bold text-white">${metrics?.currentEquity?.toLocaleString() || '0'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Unrealized P&L</span>
                            <span className={`text-sm font-bold ${metrics?.unrealizedPL && metrics.unrealizedPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {metrics?.unrealizedPL && metrics.unrealizedPL >= 0 ? '+' : ''}${metrics?.unrealizedPL?.toFixed(2) || '0.00'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Trades */}
            {data?.recentTrades && data.recentTrades.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-sm font-bold text-gray-300 mb-3 uppercase tracking-wide">Recent Trades</h3>
                    <div className="bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-900/60">
                                    <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                                        <th className="px-4 py-3">Symbol</th>
                                        <th className="px-4 py-3">Side</th>
                                        <th className="px-4 py-3">Qty</th>
                                        <th className="px-4 py-3">Price</th>
                                        <th className="px-4 py-3">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {data.recentTrades.map((trade) => (
                                        <tr key={trade.id} className="text-sm">
                                            <td className="px-4 py-3 font-bold text-white">{trade.symbol}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${trade.side === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                                    }`}>
                                                    {trade.side?.toUpperCase() ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-300">{trade.qty ?? '—'}</td>
                                            <td className={`px-4 py-3 font-medium ${trade.side === 'buy' || trade.side === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>
                                                {trade.side}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-gray-300">
                                                ${(trade.filled_avg_price || trade.entryPrice)?.toFixed(2) ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-xs">
                                                {(trade.filled_at || trade.entryTime)
                                                    ? new Date(trade.filled_at || trade.entryTime).toLocaleDateString()
                                                    : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
