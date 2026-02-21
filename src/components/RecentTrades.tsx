'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Clock, ArrowUpRight, ArrowDownRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface Trade {
    id: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    qty: number;
    entryPrice: number;
    exitPrice: number | null;
    pnl: number | null;
    pnlPercent: number | null;
    status: string;
    entryTime: string;
    exitTime: string | null;
}

export default function RecentTrades() {
    const { data: session } = useSession();
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!session) {
            setLoading(false);
            return;
        }

        async function fetchTrades() {
            try {
                const res = await fetch('/api/trading/recent');
                if (res.ok) {
                    const data = await res.json();
                    setTrades(data);
                }
            } catch {
                // Fail silently
            } finally {
                setLoading(false);
            }
        }

        fetchTrades();
    }, [session]);

    if (!session) return null;

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        return 'Just now';
    };

    return (
        <section className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700/50 overflow-hidden backdrop-blur-sm">
            <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <span className="w-1 h-5 bg-emerald-500 rounded-full"></span>
                    Recent Trades
                </h3>
                <Link href="/portfolio" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    View All →
                </Link>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                </div>
            ) : trades.length === 0 ? (
                <div className="p-6 text-center">
                    <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No trades yet</p>
                    <p className="text-xs text-gray-600 mt-1">Your recent trades will appear here</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-700/30">
                    {trades.map(trade => (
                        <div key={trade.id} className="px-4 py-3 hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${trade.side === 'BUY'
                                            ? 'bg-emerald-500/10 text-emerald-400'
                                            : 'bg-red-500/10 text-red-400'
                                        }`}>
                                        {trade.side === 'BUY' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-white text-sm">{trade.symbol}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${trade.side === 'BUY'
                                                    ? 'bg-emerald-500/15 text-emerald-400'
                                                    : 'bg-red-500/15 text-red-400'
                                                }`}>
                                                {trade.side}
                                            </span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${trade.status === 'OPEN'
                                                    ? 'bg-blue-500/15 text-blue-400'
                                                    : 'bg-gray-500/15 text-gray-400'
                                                }`}>
                                                {trade.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {trade.qty} @ ${trade.entryPrice.toFixed(2)}
                                            <span className="mx-1">·</span>
                                            {formatTime(trade.entryTime)}
                                        </p>
                                    </div>
                                </div>

                                {trade.pnl !== null && (
                                    <div className="text-right">
                                        <div className={`flex items-center gap-1 text-sm font-semibold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'
                                            }`}>
                                            {trade.pnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            ${Math.abs(trade.pnl).toFixed(2)}
                                        </div>
                                        {trade.pnlPercent !== null && (
                                            <p className={`text-xs ${trade.pnlPercent >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>
                                                {trade.pnlPercent >= 0 ? '+' : ''}{trade.pnlPercent.toFixed(2)}%
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
