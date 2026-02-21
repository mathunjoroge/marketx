
'use client';

import React, { useState, useEffect } from 'react';
import MetricsGrid from './MetricsGrid';
import EquityCurveChart from './EquityCurveChart';
import TradeJournalTable from './TradeJournalTable';
import { PerformanceMetrics, Trade } from '@/lib/trading/analytics';

export default function AnalyticsDashboard() {
    const [timeframe, setTimeframe] = useState('ALL');
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [trades, setTrades] = useState<Trade[]>([]);

    // Pagination state for Journal
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [journalLoading, setJournalLoading] = useState(true);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPerformanceData();
        fetchJournalData();
    }, [timeframe]);

    useEffect(() => {
        fetchJournalData();
    }, [page]);

    const fetchPerformanceData = async () => {
        try {
            const res = await fetch(`/api/analytics/performance?timeframe=${timeframe}`);
            if (res.ok) {
                const data = await res.json();
                setMetrics(data);
            }
        } catch (error) {
            console.error('Failed to fetch performance metrics', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchJournalData = async () => {
        setJournalLoading(true);
        try {
            const res = await fetch(`/api/analytics/journal?page=${page}&limit=10&timeframe=${timeframe}`);
            if (res.ok) {
                const data = await res.json();
                setTrades(data.trades);
                setTotalPages(data.pagination.pages);
            }
        } catch (error) {
            console.error('Failed to fetch journal', error);
        } finally {
            setJournalLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(13, 17, 23, 0.5)',
                padding: '1rem',
                borderRadius: '0.75rem',
                border: '1px solid #30363d',
                backdropFilter: 'blur(12px)'
            }}>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">
                    Portfolio Analytics
                </h2>
                <div style={{
                    display: 'flex',
                    backgroundColor: '#0d1117',
                    borderRadius: '0.5rem',
                    padding: '0.25rem',
                    border: '1px solid #30363d'
                }}>
                    {['7D', '30D', '90D', 'YTD', 'ALL'].map(tf => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            style={{
                                padding: '0.375rem 1rem',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                borderRadius: '0.375rem',
                                transition: 'all 0.2s',
                                color: timeframe === tf ? 'white' : '#6b7280',
                                backgroundColor: timeframe === tf ? '#4f46e5' : 'transparent',
                                boxShadow: timeframe === tf ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
                            }}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="animate-pulse space-y-4">
                    <div className="h-32 bg-gray-800 rounded-lg"></div>
                    <div className="h-96 bg-gray-800 rounded-lg"></div>
                </div>
            ) : metrics ? (
                <>
                    <MetricsGrid metrics={metrics} />
                    <EquityCurveChart equityCurve={metrics.equityCurve} />
                </>
            ) : (
                <div className="text-center py-10 text-gray-500">Failed to load analytics data.</div>
            )}

            <div className="mt-8">
                <h3 className="text-xl font-bold mb-4">Trade Journal</h3>
                <TradeJournalTable
                    trades={trades}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    isLoading={journalLoading}
                />
            </div>
        </div>
    );
}
