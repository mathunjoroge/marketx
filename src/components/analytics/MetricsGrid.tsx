
import React from 'react';
import { PerformanceMetrics } from '@/lib/trading/analytics';
import { ArrowUp, ArrowDown, Percent, DollarSign, Activity } from 'lucide-react';

interface MetricsGridProps {
    metrics: PerformanceMetrics;
}

export default function MetricsGrid({ metrics }: MetricsGridProps) {
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    const formatPercent = (val: number) => `${val.toFixed(2)}%`;

    const MetricCard = ({ title, value, subValue, icon: Icon, trend }: any) => (
        <div style={{
            backgroundColor: 'rgba(13, 17, 23, 0.5)',
            padding: '1.25rem',
            borderRadius: '0.75rem',
            border: '1px solid #30363d',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            transition: 'transform 0.2s, box-shadow 0.2s',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
            }}
        >
            <div className="flex justify-between items-start mb-3">
                <span className="text-gray-400 text-sm font-medium tracking-wide">{title}</span>
                <div style={{
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    backgroundColor: trend === 'up' ? 'rgba(34, 197, 94, 0.1)' : trend === 'down' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(55, 65, 81, 0.3)',
                    color: trend === 'up' ? '#4ade80' : trend === 'down' ? '#f87171' : '#9ca3af',
                    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
                }}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>
            <div>
                <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 mb-1 tracking-tight">{value}</div>
                {subValue && (
                    <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        fontWeight: 500
                    }}>
                        {subValue}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
                title="Total Return"
                value={formatCurrency(metrics.totalReturn)}
                subValue={formatPercent(metrics.totalReturnPercent)}
                icon={DollarSign}
                trend={metrics.totalReturn >= 0 ? 'up' : 'down'}
            />
            <MetricCard
                title="Win Rate"
                value={formatPercent(metrics.winRate)}
                subValue={`${metrics.winningTrades}W - ${metrics.losingTrades}L`}
                icon={Percent}
                trend={metrics.winRate > 50 ? 'up' : 'down'}
            />
            <MetricCard
                title="Profit Factor"
                value={metrics.profitFactor.toFixed(2)}
                subValue={metrics.profitFactor > 1.5 ? 'Excellent' : metrics.profitFactor > 1 ? 'Profitable' : 'Unprofitable'}
                icon={Activity}
                trend={metrics.profitFactor > 1 ? 'up' : 'down'}
            />
            <MetricCard
                title="Max Drawdown"
                value={formatPercent(metrics.maxDrawdownPercent)}
                subValue={`-$${Math.abs(metrics.maxDrawdown).toFixed(2)}`}
                icon={ArrowDown}
                trend="down"
            />
        </div>
    );
}
