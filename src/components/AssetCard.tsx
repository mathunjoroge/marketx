'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Info, TrendingUp, TrendingDown, AlertCircle, Maximize2, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { StackedEdgeResult } from '@/lib/stackedEdge';
import { useMarketData } from '@/hooks/useMarketData';
import MarketChart from './MarketChart';
import WatchlistButton from './WatchlistButton';
import BracketOrderForm from './BracketOrderForm';

interface AssetCardProps {
    symbol: string;
    name: string;
    assetClass: string;
}

export default function AssetCard({ symbol, name, assetClass }: AssetCardProps) {
    // UI State
    const [showDetails, setShowDetails] = useState(false);
    const [showBracketForm, setShowBracketForm] = useState(false);

    // Data Fetching Hook
    const { data, loading, error } = useMarketData(symbol, assetClass, {
        pollInterval: 60000,
        stackedEdge: true,
        interval: '240' // 4h timeframe for analysis
    });

    if (loading) return (
        <div className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900/50 p-5 h-64 animate-pulse">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <div className="h-6 w-32 bg-gray-800 rounded mb-2"></div>
                    <div className="h-4 w-16 bg-gray-800 rounded"></div>
                </div>
                <div className="h-5 w-16 bg-gray-800 rounded-full"></div>
            </div>

            <div className="flex-1 bg-gray-800/50 rounded-lg mb-4 h-24"></div>

            <div className="flex justify-between items-end mt-auto">
                <div>
                    <div className="h-8 w-24 bg-gray-800 rounded mb-1"></div>
                    <div className="h-4 w-20 bg-gray-800 rounded"></div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="h-5 w-16 bg-gray-800 rounded"></div>
                    <div className="h-3 w-12 bg-gray-800 rounded"></div>
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="relative overflow-hidden rounded-xl border border-red-900/30 bg-gray-900/50 p-5 h-64 flex items-center justify-center">
            <div className="text-center text-red-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Failed to load data</p>
                <p className="text-xs opacity-70 mt-1">{symbol}</p>
            </div>
        </div>
    );

    const se: StackedEdgeResult = data?.stackedEdge;
    const isHighBull = se?.netBias === 'Bullish' && se?.bullishScore >= 6;
    const isHighBear = se?.netBias === 'Bearish' && se?.bearishScore >= 6;

    // Dynamic styles based on sentiment
    const containerStyle: React.CSSProperties = {
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        backgroundColor: 'rgba(13, 17, 23, 0.6)',
        backdropFilter: 'blur(12px)',
        borderRadius: '0.75rem',
        padding: '1.25rem',
        border: '1px solid #30363d',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
    };

    if (isHighBull) {
        containerStyle.border = '1px solid rgba(34, 197, 94, 0.5)';
        containerStyle.boxShadow = '0 0 15px rgba(34, 197, 94, 0.2), inset 0 0 20px rgba(34, 197, 94, 0.05)';
    } else if (isHighBear) {
        containerStyle.border = '1px solid rgba(239, 68, 68, 0.5)';
        containerStyle.boxShadow = '0 0 15px rgba(239, 68, 68, 0.2), inset 0 0 20px rgba(239, 68, 68, 0.05)';
    }

    const getScoreBadgeStyle = () => {
        const baseStyle = {
            fontSize: '0.625rem',
            fontWeight: 600,
            padding: '0.125rem 0.5rem',
            borderRadius: '0.375rem',
            border: '1px solid',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            transition: 'all 0.2s',
        };

        if (se?.netBias === 'Bullish') {
            if (se.bullishScore >= 6) return { ...baseStyle, color: '#4ade80', borderColor: 'rgba(74, 222, 128, 0.3)', backgroundColor: 'rgba(74, 222, 128, 0.1)' };
            if (se.bullishScore >= 4) return { ...baseStyle, color: '#facc15', borderColor: 'rgba(250, 204, 21, 0.3)', backgroundColor: 'rgba(250, 204, 21, 0.1)' };
        } else if (se?.netBias === 'Bearish') {
            if (se.bearishScore >= 6) return { ...baseStyle, color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.3)', backgroundColor: 'rgba(248, 113, 113, 0.1)' };
            if (se.bearishScore >= 4) return { ...baseStyle, color: '#facc15', borderColor: 'rgba(250, 204, 21, 0.3)', backgroundColor: 'rgba(250, 204, 21, 0.1)' };
        }
        return { ...baseStyle, color: '#9ca3af', borderColor: 'rgba(156, 163, 175, 0.3)', backgroundColor: 'rgba(156, 163, 175, 0.1)' };
    };

    return (
        <div style={containerStyle} className="group hover:border-gray-500/50">
            {/* Full Screen Link - Top Right Corner */}
            <Link
                href={`/asset/${symbol}?assetClass=${assetClass}&name=${encodeURIComponent(name)}`}
                className="absolute top-3 right-3 p-1.5 bg-[#1f2937]/90 backdrop-blur-md rounded-lg text-gray-400 border border-gray-700/50 z-40 opacity-0 group-hover:opacity-100 hover:bg-blue-600/20 hover:text-blue-400 hover:border-blue-500/50 transition-all duration-300 shadow-xl"
                style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    zIndex: 40
                }}
                title="Full Page Analysis"
            >
                <Maximize2 className="w-4 h-4" />
            </Link>

            {/* Watchlist Star */}
            <div className="absolute top-3 right-14 z-50 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                <WatchlistButton symbol={symbol} />
            </div>

            {/* Signal Badge */}
            {(isHighBull || isHighBear) && (
                <div className="absolute top-0 left-0 z-20">
                    <div style={{
                        background: isHighBull ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: 'white',
                        fontSize: '9px',
                        fontWeight: 800,
                        padding: '0.125rem 0.75rem',
                        borderBottomRightRadius: '0.75rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        letterSpacing: '0.05em'
                    }}>
                        {isHighBull ? 'STRONG LONG' : 'STRONG SHORT'}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        {name}
                        {isHighBull && <TrendingUp className="w-5 h-5 text-green-400" />}
                        {isHighBear && <TrendingDown className="w-5 h-5 text-red-400" />}
                    </h2>
                    <p className="text-sm text-gray-400 font-medium">{symbol}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 bg-gray-800/40 rounded-full uppercase text-gray-300 border border-gray-700/40">
                        {assetClass}
                    </span>
                    {se && (
                        <div
                            style={getScoreBadgeStyle()}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowDetails(!showDetails);
                            }}
                            className="hover:scale-105 active:scale-95 shadow-sm"
                        >
                            {se.netBias} {se.netBias === 'Bullish' ? se.bullishScore : se.bearishScore}/{se.maxScore}
                            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </div>
                    )}
                </div>
            </div>

            <MarketChart symbol={symbol} assetClass={assetClass} />

            {/* Price Info */}
            <div className="mt-4 flex justify-between items-end">
                <div>
                    <span className="text-2xl font-bold text-white tracking-tight">${data?.price?.toFixed(2) || '---'}</span>
                    <div className={`text-sm font-semibold flex items-center gap-1 ${data?.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {data?.change >= 0 ? '+' : ''}{data?.change?.toFixed(2)} ({data?.changePercent?.toFixed(2)}%)
                    </div>
                </div>
                {se && (
                    <div className="flex flex-col items-end">
                        <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '0.25rem',
                            backgroundColor: se.phase === 'Confirmation' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(55, 65, 81, 0.3)',
                            color: se.phase === 'Confirmation' ? '#4ade80' : '#9ca3af',
                            border: se.phase === 'Confirmation' ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(75, 85, 99, 0.2)'
                        }}>
                            {se.phase}
                        </span>
                        <span className="text-[9px] text-gray-500 mt-1 font-medium">4H Timeframe</span>
                    </div>
                )}
            </div>

            {/* Confluence Alert */}
            {(isHighBull || isHighBear) && (
                <div style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '0.5rem',
                    backgroundColor: isHighBull ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                    border: isHighBull ? '1px solid rgba(34, 197, 94, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)',
                    color: isHighBull ? '#86efac' : '#fca5a5'
                }}>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span className="leading-tight">
                        {isHighBull
                            ? "High Confluence: Trend, volume, and momentum alignment."
                            : "High Prob Setup: Indicators signal potential breakdown."}
                    </span>
                </div>
            )}

            {/* Detailed Analytics */}
            {showDetails && se && (
                <div className="mt-4 pt-3 border-t border-gray-700/50 space-y-2 animate-in fade-in slide-in-from-top-1 bg-black/20 -mx-5 px-5 pb-2">
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 mt-2">Signal Matrix</h3>
                    <div className="grid grid-cols-1 gap-1.5">
                        {se.indicators.map((ind, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs p-1.5 rounded bg-gray-800/40 border border-gray-700/30">
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-300">{ind.name}</span>
                                    <span className="text-[9px] text-gray-500">{ind.category}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400 font-mono">{ind.value}</span>
                                    <span style={{
                                        fontSize: '0.65rem',
                                        padding: '0.125rem 0.375rem',
                                        borderRadius: '0.25rem',
                                        fontWeight: 600,
                                        backgroundColor: ind.side === 'Bullish' ? 'rgba(34, 197, 94, 0.1)' : ind.side === 'Bearish' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                        color: ind.side === 'Bullish' ? '#4ade80' : ind.side === 'Bearish' ? '#f87171' : '#9ca3af'
                                    }}>
                                        {ind.side}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="mt-4 pt-4 border-t border-gray-700/50 flex gap-2">
                <button
                    onClick={() => setShowBracketForm(true)}
                    className="flex-1 hover:bg-indigo-600/30 hover:border-indigo-400/60 text-xs font-bold py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] border border-indigo-500/40 text-indigo-300 bg-indigo-900/20"
                >
                    <Target className="w-3.5 h-3.5" />
                    Smart Entry
                </button>
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="px-3 py-2.5 rounded-lg hover:bg-gray-700/50 hover:text-white hover:border-gray-500 transition-all active:scale-[0.98] bg-gray-800/30 border border-gray-700/40 text-gray-400"
                    title={showDetails ? "Hide Details" : "Show Details"}
                >
                    {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>

            {/* Bracket Order Modal */}
            {showBracketForm && (
                <BracketOrderForm
                    symbol={symbol}
                    currentPrice={data?.price || 0}
                    onClose={() => setShowBracketForm(false)}
                    onSuccess={() => {
                        setShowBracketForm(false);
                    }}
                />
            )}
        </div>
    );
}
