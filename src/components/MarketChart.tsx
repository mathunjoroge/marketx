'use client';

import { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Tooltip,
    Legend,
    Filler,
    ChartOptions
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { HistoricalBar } from '@/lib/providers/types';
import { useMarket } from '@/context/MarketContext';
import { calculateSMA, calculateEMA, calculateRSI, calculateMACD } from '@/lib/indicators';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Tooltip,
    Legend,
    Filler
);

interface MarketChartProps {
    symbol: string;
    assetClass: string;
    initialInterval?: string;
    showSelector?: boolean;
}

const INTERVALS = [
    { label: '5M', value: '5' },
    { label: '15M', value: '15' },
    { label: '1H', value: '60' },
    { label: '4H', value: '240' },
    { label: '1D', value: 'D' },
    { label: '1W', value: 'W' },
    { label: '1M', value: 'M' },
];

export default function MarketChart({ symbol, assetClass, initialInterval = '240', showSelector = false }: MarketChartProps) {
    const { country, showStackedEdge } = useMarket();
    const [data, setData] = useState<HistoricalBar[]>([]);
    const [loading, setLoading] = useState(true);
    const [interval, setIntervalState] = useState(initialInterval);

    // Sync loading state and prev values during render to avoid cascading effect renders
    const [prevSymbol, setPrevSymbol] = useState(symbol);
    const [prevInterval, setPrevInterval] = useState(interval);
    const [prevCountry, setPrevCountry] = useState(country);

    if (symbol !== prevSymbol || interval !== prevInterval || country !== prevCountry) {
        setPrevSymbol(symbol);
        setPrevInterval(interval);
        setPrevCountry(country);
        setLoading(true);
    }

    useEffect(() => {
        fetch(`/api/market-data?symbol=${symbol}&assetClass=${assetClass}&history=true&country=${country}&limit=250&interval=${interval}`)
            .then(res => {
                if (!res.ok) throw new Error('Data not available');
                return res.json();
            })
            .then(setData)
            .catch((err) => {
                console.error(err);
                setData([]);
            })
            .finally(() => setLoading(false));
    }, [symbol, assetClass, country, interval]);

    if (loading) return <div className="animate-pulse h-64 bg-gray-800 rounded-xl"></div>;

    const closes = data.map(d => d.close);
    const sma200 = calculateSMA(closes, 200);
    const ema20 = calculateEMA(closes, 20);
    const rsiValues = calculateRSI(closes, 14);
    const macdData = calculateMACD(closes);

    const intraday = ['5', '15', '60'].includes(interval);
    const visiblePoints = intraday ? 80 : 40;

    const slice = data.slice(-visiblePoints);
    const chartLabels = slice.map(d => {
        const date = new Date(d.time);
        if (intraday || interval === '240') {
            return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        return `${date.getMonth() + 1}/${date.getDate()}`;
    });

    const priceData = closes.slice(-visiblePoints);
    const rsiSlice = rsiValues.slice(-visiblePoints);
    const macdHistSlice = macdData.histogram.slice(-visiblePoints);

    const sharedOptions: ChartOptions<'line' | 'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(13, 17, 23, 0.95)',
                titleColor: '#ffffff',
                bodyColor: '#8b949e',
                borderColor: '#30363d',
                borderWidth: 1,
                padding: 10,
                cornerRadius: 8,
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#8b949e', font: { size: 10 }, autoSkip: true, maxTicksLimit: 8 },
            },
            y: {
                position: 'right',
                grid: { color: 'rgba(48, 54, 61, 0.2)' },
                ticks: { color: '#8b949e', font: { size: 10 } },
                grace: '10%',
            },
        },
    };

    return (
        <div className="w-full h-full flex flex-col gap-4">
            {showSelector && (
                <div className="flex flex-wrap gap-1 bg-gray-900/50 p-1 rounded-lg border border-gray-800 mb-2 w-fit">
                    {INTERVALS.map((opt) => (
                        <button key={opt.value} onClick={() => setIntervalState(opt.value)}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${interval === opt.value
                                ? 'bg-indigo-600 text-white shadow-lg'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                                }`}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Price Window */}
            <div style={{ position: 'relative', flex: showSelector ? '2 1 0%' : 'none', height: showSelector ? 'auto' : '150px', minHeight: showSelector ? '300px' : 'none' }}>
                <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', fontSize: '10px', fontWeight: 'bold', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em', zIndex: 10, pointerEvents: 'none' }}>Price Window</div>
                <Line
                    data={{
                        labels: chartLabels,
                        datasets: [
                            {
                                label: 'Price',
                                data: priceData,
                                borderColor: '#1f6feb',
                                backgroundColor: 'rgba(31, 111, 235, 0.1)',
                                borderWidth: 2,
                                pointRadius: 0,
                                fill: true,
                                tension: 0.1,
                            },
                            ...(showStackedEdge ? [
                                { label: 'SMA 200', data: sma200.slice(-visiblePoints), borderColor: '#ea4335', borderWidth: 1, borderDash: [5, 5], pointRadius: 0 },
                                { label: 'EMA 20', data: ema20.slice(-visiblePoints), borderColor: '#fbbc05', borderWidth: 1, pointRadius: 0 }
                            ] : [])
                        ]
                    }}
                    options={({ ...sharedOptions, scales: { ...sharedOptions.scales, x: { ...sharedOptions.scales?.x, display: !showSelector } } } as ChartOptions<'line'>)}
                />
            </div>

            {showSelector && (
                <>
                    {/* RSI Window */}
                    <div style={{ height: '120px', position: 'relative', backgroundColor: 'rgba(15, 23, 42, 0.2)', borderTop: '1px solid #30363d', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                        <div style={{ position: 'absolute', top: '0.25rem', left: '0.5rem', fontSize: '10px', fontWeight: 'bold', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em', zIndex: 10, pointerEvents: 'none' }}>RSI Oscillator (14)</div>
                        <Line
                            data={{
                                labels: chartLabels,
                                datasets: [{
                                    label: 'RSI',
                                    data: rsiSlice,
                                    borderColor: '#a855f7',
                                    borderWidth: 1.5,
                                    pointRadius: 0,
                                    tension: 0.1,
                                }]
                            }}
                            options={({
                                ...sharedOptions,
                                scales: {
                                    ...sharedOptions.scales,
                                    x: { ...sharedOptions.scales?.x, display: false },
                                    y: { ...sharedOptions.scales?.y, min: 0, max: 100 }
                                }
                            } as ChartOptions<'line'>)}
                        />
                    </div>

                    {/* MACD Window */}
                    <div style={{ height: '120px', position: 'relative', backgroundColor: 'rgba(15, 23, 42, 0.2)', borderTop: '1px solid #30363d', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                        <div style={{ position: 'absolute', top: '0.25rem', left: '0.5rem', fontSize: '10px', fontWeight: 'bold', color: '#8b949e', textTransform: 'uppercase', letterSpacing: '0.05em', zIndex: 10, pointerEvents: 'none' }}>MACD Histogram</div>
                        <Bar
                            data={{
                                labels: chartLabels,
                                datasets: [{
                                    label: 'MACD Hist',
                                    data: macdHistSlice,
                                    backgroundColor: macdHistSlice.map(v => v >= 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'),
                                    borderColor: macdHistSlice.map(v => v >= 0 ? '#22c55e' : '#ef4444'),
                                    borderWidth: 1,
                                    borderRadius: 1,
                                    categoryPercentage: 1.0,
                                    barPercentage: 0.9,
                                }]
                            }}
                            options={({
                                ...sharedOptions,
                                scales: {
                                    ...sharedOptions.scales,
                                    x: { ...sharedOptions.scales?.x, display: true },
                                    y: { ...sharedOptions.scales?.y, grace: '20%' }
                                }
                            } as ChartOptions<'bar'>)}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
