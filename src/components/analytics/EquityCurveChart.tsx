
'use client';

import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ScriptableContext,
    TooltipItem,
    ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { EquityPoint } from '@/lib/trading/analytics';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface EquityCurveChartProps {
    equityCurve: EquityPoint[];
}

export default function EquityCurveChart({ equityCurve }: EquityCurveChartProps) {
    // If no data, showing empty state
    if (!equityCurve || equityCurve.length === 0) {
        return (
            <div style={{
                backgroundColor: 'rgba(13, 17, 23, 0.5)',
                padding: '1.5rem',
                borderRadius: '0.75rem',
                border: '1px solid #30363d',
                height: '24rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                gap: '1rem'
            }}>
                <div style={{
                    padding: '1rem',
                    backgroundColor: 'rgba(55, 65, 81, 0.2)',
                    borderRadius: '50%',
                    border: '1px solid rgba(75, 85, 99, 0.3)'
                }}>
                    {/* Using a simple SVG since LineChart import might not be available or compatible with chart.js imports above */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3v18h18" />
                        <path d="m19 9-5 5-4-4-3 3" />
                    </svg>
                </div>
                <div className="text-center">
                    <p className="text-gray-400 font-medium mb-1">No data yet</p>
                    <p className="text-sm text-gray-500">Start trading to see your performance equity curve.</p>
                </div>
            </div>
        );
    }

    const data = {
        labels: equityCurve.map(p => p.date),
        datasets: [
            {
                label: 'Portfolio Equity',
                data: equityCurve.map(p => p.equity),
                borderColor: '#4f46e5', // Indigo
                backgroundColor: (context: ScriptableContext<'line'>) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.2)');
                    gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointBackgroundColor: '#4f46e5',
                borderWidth: 2
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                titleColor: '#e5e7eb',
                bodyColor: '#e5e7eb',
                borderColor: '#374151',
                borderWidth: 1,
                padding: 10,
                displayColors: false,
                callbacks: {
                    label: function (context: TooltipItem<'line'>) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                        }
                        return label;
                    }
                }
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                    drawBorder: false,
                },
                ticks: {
                    color: '#6b7280',
                    maxTicksLimit: 8,
                    font: {
                        size: 10
                    }
                }
            },
            y: {
                grid: {
                    color: 'rgba(55, 65, 81, 0.3)',
                    borderDash: [5, 5],
                    drawBorder: false,
                },
                ticks: {
                    color: '#6b7280',
                    font: {
                        size: 10
                    },
                    callback: function (value: number | string) {
                        const numericValue = typeof value === 'string' ? parseFloat(value) : value;
                        return '$' + numericValue / 1000 + 'k';
                    }
                }
            },
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false
        }
    };

    const typedOptions: ChartOptions<'line'> = options;

    return (
        <div style={{
            backgroundColor: 'rgba(13, 17, 23, 0.5)',
            padding: '1.5rem',
            borderRadius: '0.75rem',
            border: '1px solid #30363d',
            height: '24rem',
            marginTop: '1.5rem'
        }}>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                Equity Curve
            </h3>
            <div className="h-80">
                <Line options={typedOptions} data={data} key={equityCurve.length} />
            </div>
        </div>
    );
}
