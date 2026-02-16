
'use client';

import React from 'react';
import { Trade } from '@/lib/trading/analytics';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface TradeJournalTableProps {
    trades: Trade[];
    page: number;
    totalPages: number;
    onPageChange: (newPage: number) => void;
    isLoading?: boolean;
}

export default function TradeJournalTable({
    trades,
    page,
    totalPages,
    onPageChange,
    isLoading
}: TradeJournalTableProps) {

    if (isLoading) {
        return <div className="animate-pulse bg-gray-800 h-64 rounded-lg"></div>;
    }

    if (trades.length === 0) {
        return (
            <div style={{
                backgroundColor: 'rgba(13, 17, 23, 0.5)',
                padding: '3rem',
                borderRadius: '0.75rem',
                border: '1px solid #30363d',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem'
            }}>
                <div style={{
                    padding: '1rem',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    borderRadius: '50%',
                    border: '1px solid rgba(79, 70, 229, 0.2)'
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#818cf8' }}>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                        <path d="M16 13H8" />
                        <path d="M16 17H8" />
                        <path d="M10 9H8" />
                    </svg>
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-bold text-gray-200 mb-1">Trade Journal Empty</h3>
                    <p className="text-gray-500 max-w-sm">
                        No trades found matching your criteria. Place your first trade to start tracking your journey.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: 'rgba(13, 17, 23, 0.5)',
            borderRadius: '0.75rem',
            border: '1px solid #30363d',
            overflow: 'hidden'
        }}>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead style={{
                        backgroundColor: 'rgba(55, 65, 81, 0.3)',
                        color: '#9ca3af',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Symbol</th>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Entry</th>
                            <th className="px-6 py-4">Exit</th>
                            <th className="px-6 py-4">P&L</th>
                            <th className="px-6 py-4">Exit Reason</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {trades.map((trade) => {
                            const isWin = (trade.pnl || 0) > 0;
                            return (
                                <tr key={trade.id} className="hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                                        {new Date(trade.exitTime as string).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-200">
                                        {trade.symbol}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span style={{
                                            padding: '0.25rem 0.625rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            backgroundColor: trade.side === 'LONG' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(249, 115, 22, 0.15)',
                                            color: trade.side === 'LONG' ? '#60a5fa' : '#fb923c',
                                            border: trade.side === 'LONG' ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(249, 115, 22, 0.2)'
                                        }}>
                                            {trade.side}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300 font-mono">${trade.entryPrice.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-gray-300 font-mono">${trade.exitPrice?.toFixed(2)}</td>
                                    <td className={`px-6 py-4 font-bold font-mono ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                                        {trade.pnl ? (trade.pnl > 0 ? '+' : '') + trade.pnl.toFixed(2) : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span style={{
                                            backgroundColor: '#1f2937',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            color: '#d1d5db',
                                            border: '1px solid #374151'
                                        }}>
                                            {trade.exitReason || 'MANUAL'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 bg-gray-900/30">
                <div className="text-sm text-gray-400">
                    Page <span className="text-gray-200 font-medium">{page}</span> of <span className="text-gray-200 font-medium">{totalPages}</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onPageChange(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="p-1.5 rounded-md hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-400 hover:text-white"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="p-1.5 rounded-md hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-gray-400 hover:text-white"
                    >
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
