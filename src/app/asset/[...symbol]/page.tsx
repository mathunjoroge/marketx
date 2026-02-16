'use client';

import { useSearchParams, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useMarket } from '@/context/MarketContext';
import MarketChart from '@/components/MarketChart';
import AdvancedOrderPanel from '@/components/AdvancedOrderPanel';
import { StackedEdgeResult } from '@/lib/stackedEdge';
import { ChevronLeft, Activity, Zap, Shield, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function AssetDetail() {
    const params = useParams();
    const searchParams = useSearchParams();
    const symbolParam = params.symbol;
    const symbol = Array.isArray(symbolParam) ? symbolParam.join('/') : symbolParam as string;
    const assetClass = searchParams.get('assetClass') || 'stock';
    const name = searchParams.get('name') || symbol;

    const { country } = useMarket();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const res = await fetch(`/api/market-data?symbol=${symbol}&assetClass=${assetClass}&country=${country}&stackedEdge=true`);
                const json = await res.json();
                setData(json);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMeta();
    }, [symbol, assetClass, country]);

    const se: StackedEdgeResult = data?.stackedEdge;
    const isHighBull = se?.netBias === 'Bullish' && se?.bullishScore >= 6;
    const isHighBear = se?.netBias === 'Bearish' && se?.bearishScore >= 6;

    const getBiasColor = () => {
        if (se?.netBias === 'Bullish') return 'text-green-400';
        if (se?.netBias === 'Bearish') return 'text-red-400';
        return 'text-yellow-400';
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0d1117] text-gray-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Navigation */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="p-2 hover:bg-gray-800 rounded-xl transition-colors border border-gray-800">
                        <ChevronLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            {name}
                            <span className="text-gray-500 text-xl font-normal">({symbol})</span>
                        </h1>
                        <div className="flex items-center gap-4 mt-1 text-sm">
                            <span className="px-2 py-0.5 bg-gray-800 rounded text-gray-400 uppercase tracking-wider text-[10px] font-bold">
                                {assetClass}
                            </span>
                            <span className={`font-bold text-xl ${data?.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ${data?.price?.toFixed(2)}
                            </span>
                            <span className={`font-medium ${data?.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {data?.change >= 0 ? '+' : ''}{data?.change?.toFixed(2)} ({data?.changePercent?.toFixed(2)}%)
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-8">
                    {/* Main Content: Chart and Trading Panel */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Chart - 2/3 width on large screens */}
                        <div className="lg:col-span-2">
                            <div className="border rounded-3xl p-6 relative" style={{ backgroundColor: '#161b22', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden' }}>
                                {(isHighBull || isHighBear) && (
                                    <div className="absolute" style={{ top: 0, right: 0, padding: '0.5rem 1.5rem', borderBottomLeftRadius: '1.5rem', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: isHighBull ? '#22c55e' : '#ef4444', color: 'black' }}>
                                        {isHighBull ? 'Strong Bullish Consensus' : 'Strong Bearish Consensus'}
                                    </div>
                                )}
                                <div style={{ height: '650px' }}>
                                    <MarketChart
                                        symbol={symbol}
                                        assetClass={assetClass}
                                        showSelector={true}
                                        initialInterval="240"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Trading Panel - 1/3 width on large screens */}
                        <div className="lg:col-span-1">
                            <AdvancedOrderPanel
                                symbol={symbol}
                                currentPrice={data?.price}
                                assetClass={assetClass}
                            />
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="border rounded-2xl p-5 flex items-center gap-4 transition-colors" style={{ backgroundColor: '#161b22' }}>
                            <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#818cf8' }}>
                                <Activity className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <p style={{ fontSize: '0.75rem', color: '#8b949e', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', margin: 0 }}>Stacked Edge Bias</p>
                                <p className={getBiasColor()} style={{ fontSize: '1.125rem', fontWeight: 900, margin: 0 }}>{se?.netBias}</p>
                            </div>
                            <div style={{ fontSize: '10px', color: '#484f58', fontFamily: 'monospace' }}>ID: BIAS_01</div>
                        </div>
                        <div className="border rounded-2xl p-5 flex items-center gap-4 transition-colors" style={{ backgroundColor: '#161b22' }}>
                            <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#facc15' }}>
                                <Zap className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <p style={{ fontSize: '0.75rem', color: '#8b949e', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', margin: 0 }}>Consensus Score</p>
                                <p style={{ fontSize: '1.125rem', fontWeight: 900, color: 'white', margin: 0 }}>
                                    {se?.netBias === 'Bullish' ? se.bullishScore : se.bearishScore} / {se?.maxScore}
                                </p>
                            </div>
                            <div style={{ fontSize: '10px', color: '#484f58', fontFamily: 'monospace' }}>CS: {((se?.netBias === 'Bullish' ? se.bullishScore : se.bearishScore) / 7 * 100).toFixed(0)}%</div>
                        </div>
                        <div className="border rounded-2xl p-5 flex items-center gap-4 transition-colors" style={{ backgroundColor: '#161b22' }}>
                            <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#4ade80' }}>
                                <Shield className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <p style={{ fontSize: '0.75rem', color: '#8b949e', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', margin: 0 }}>Signal Quality</p>
                                <p style={{ fontSize: '1.125rem', fontWeight: 900, color: 'white', margin: 0 }}>{se?.phase}</p>
                            </div>
                            <div style={{ fontSize: '10px', color: '#484f58', fontFamily: 'monospace' }}>PH: DET_0{se?.phase?.length}</div>
                        </div>
                    </div>

                    {/* Indicator Grid (MetaTrader Style) */}
                    <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-8">
                        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                            <h3 className="text-xl font-bold flex items-center gap-3">
                                <BarChart3 className="w-6 h-6 text-indigo-500" />
                                Indicator Terminal Breakdown
                            </h3>
                            <div className="flex gap-4">
                                <span className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    Live Feed
                                </span>
                                <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">Terminal: MT-X-048</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {se?.indicators.map((ind, idx) => (
                                <div key={idx} className="bg-gray-900/60 p-4 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all group">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-xs font-black text-gray-300 uppercase tracking-tight">{ind.name}</span>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${ind.side === 'Bullish' ? 'bg-green-500/20 text-green-400' :
                                            ind.side === 'Bearish' ? 'bg-red-500/20 text-red-400' :
                                                'bg-gray-800 text-gray-500'
                                            }`}>
                                            {ind.side}
                                        </span>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-sm font-mono text-indigo-400 font-bold">{ind.value}</p>
                                    </div>
                                    <p className="text-[10px] text-gray-500 leading-relaxed font-medium line-clamp-2 italic">{ind.description}</p>
                                </div>
                            ))}

                            {/* Consensus Logic Card */}
                            <div className="lg:col-span-1 bg-indigo-500/5 p-4 rounded-2xl border border-indigo-500/20 flex flex-col justify-center">
                                <p className="text-[10px] text-gray-400 leading-relaxed">
                                    <strong className="text-indigo-400 uppercase tracking-widest block mb-2 underline">Algorithm Note</strong>
                                    CON-X-7 Aggregator confirms direction when Momentum (RSI) and Volatility (Bands) align with Trend (SMA/EMA).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
