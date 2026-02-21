'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, Wallet, PieChart } from 'lucide-react';
import TrailingStopForm from './TrailingStopForm';
import { useAccount, Position } from '@/hooks/useAccount';
import Link from 'next/link';

export default function PortfolioDashboard({ compact = false }: { compact?: boolean }) {
    // Hook State
    const { account, positions, loading, error, refetch } = useAccount({
        pollInterval: 5000,
        fetchPositions: true
    });

    // Local State
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

    const handleClosePosition = async (symbol: string) => {
        if (!confirm(`Are you sure you want to close ${symbol}?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/trading/positions/${symbol}`, {
                method: 'DELETE',
            });

            const data = await res.json();

            if (data.success) {
                alert(`Position ${symbol} closed successfully`);
                refetch(); // Refresh data
            } else {
                alert(`Error: ${data.error || 'Failed to close position'}`);
            }
        } catch (err: unknown) {
            alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    if (loading) {
        return (
            <div className={compact ? "p-4 animate-pulse text-gray-400" : "flex items-center justify-center min-h-screen"}>
                <div className="animate-pulse text-gray-400 text-sm">Loading portfolio...</div>
            </div>
        );
    }

    if (error) {
        // In compact mode, just return null or minimal error to avoid breaking dashboard layout
        if (compact) return null;
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-500">Error: {error}</div>
            </div>
        );
    }

    const totalPL = positions.reduce((sum, pos) => sum + parseFloat(pos.unrealized_pl), 0);
    const totalPLPercent = account ?
        ((parseFloat(account.equity) - parseFloat(account.last_equity || '0')) / parseFloat(account.last_equity || '1') * 100) : 0;

    return (
        <div className={compact ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
            {!compact && (
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 mb-8">
                    Portfolio
                </h1>
            )}

            {/* Account Summary Cards */}
            {account && (
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${compact ? '' : 'mb-8'}`}>
                    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 shadow-xl">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <DollarSign className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="text-sm text-gray-400 font-semibold uppercase">Portfolio Value</span>
                        </div>
                        <div className="text-3xl font-bold text-white">
                            ${parseFloat(account.portfolio_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 shadow-xl">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <Wallet className="w-5 h-5 text-green-400" />
                            </div>
                            <span className="text-sm text-gray-400 font-semibold uppercase">Cash</span>
                        </div>
                        <div className="text-3xl font-bold text-white">
                            ${parseFloat(account.cash).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 shadow-xl">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-purple-400" />
                            </div>
                            <span className="text-sm text-gray-400 font-semibold uppercase">Total P&L</span>
                        </div>
                        <div className={`text-3xl font-bold ${totalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {totalPL >= 0 ? '+' : ''}${totalPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className={`text-sm ${totalPL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {totalPLPercent >= 0 ? '+' : ''}{totalPLPercent.toFixed(2)}%
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-700/50 shadow-xl">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <PieChart className="w-5 h-5 text-indigo-400" />
                            </div>
                            <span className="text-sm text-gray-400 font-semibold uppercase">Buying Power</span>
                        </div>
                        <div className="text-3xl font-bold text-white">
                            ${parseFloat(account.buying_power).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>
            )}

            {/* Positions Table - Only show if not compact */}
            {!compact && (
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 overflow-hidden mt-8">
                    <div className="p-6 border-b border-gray-700/50">
                        <h2 className="text-2xl font-bold text-white">Open Positions</h2>
                        <p className="text-gray-400 text-sm mt-1">{positions.length} position{positions.length !== 1 ? 's' : ''}</p>
                    </div>

                    {positions.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            No open positions. Start trading to see your positions here.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-900/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Symbol</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Qty</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Price</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Current Price</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Market Value</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">P&L</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">P&L %</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700/30">
                                    {positions.map((position) => {
                                        const pl = parseFloat(position.unrealized_pl);
                                        const plpc = parseFloat(position.unrealized_plpc) * 100;

                                        return (
                                            <tr key={position.symbol} className="hover:bg-gray-800/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <Link href={`/asset/${position.symbol}?assetClass=stock&name=${position.symbol}`} className="font-bold text-blue-400 hover:text-blue-300">
                                                        {position.symbol}
                                                    </Link>
                                                </td>
                                                <td className="px-6 py-4 text-right text-white">{(position.qty).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right text-gray-300">${parseFloat(position.avg_entry_price).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right text-white font-semibold">${parseFloat(position.current_price).toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right text-white font-semibold">${parseFloat(position.market_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className={`px-6 py-4 text-right font-bold ${pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {pl >= 0 ? '+' : ''}${pl.toFixed(2)}
                                                </td>
                                                <td className={`px-6 py-4 text-right font-bold ${plpc >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {plpc >= 0 ? '+' : ''}{plpc.toFixed(2)}%
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setSelectedPosition(position)}
                                                            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold rounded-lg border border-blue-600/50 transition-colors flex items-center gap-1"
                                                        >
                                                            <TrendingUp className="w-3 h-3" />
                                                            Trail
                                                        </button>
                                                        <button
                                                            onClick={() => handleClosePosition(position.symbol)}
                                                            className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-bold rounded-lg border border-red-600/50 transition-colors"
                                                        >
                                                            Close
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Trailing Stop Modal */}
            {!compact && selectedPosition && (
                <TrailingStopForm
                    symbol={selectedPosition.symbol}
                    currentPrice={parseFloat(selectedPosition.current_price)}
                    positionQty={selectedPosition.qty}
                    onClose={() => setSelectedPosition(null)}
                    onSuccess={() => {
                        // Optional: Show success toast
                        setSelectedPosition(null);
                        refetch(); // Refresh data using hook
                    }}
                />
            )}
        </div>
    );
}
