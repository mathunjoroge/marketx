'use client';

import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface RiskCalculatorProps {
    currentPrice?: number;
    accountValue?: number;
    buyingPower?: number;
    onApplyToOrder?: (shares: number, stopPrice: number, takeProfitPrice: number) => void;
}

export default function RiskCalculator({
    currentPrice = 0,
    accountValue = 100000,
    buyingPower = 200000,
    onApplyToOrder,
}: RiskCalculatorProps) {
    const [riskPercent, setRiskPercent] = useState(1);
    const [entryPrice, setEntryPrice] = useState(currentPrice);
    const [stopPrice, setStopPrice] = useState(0);
    const [targetPrice, setTargetPrice] = useState(0);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentPrice > 0) {
            setEntryPrice(currentPrice);
            // Set default stop at 5% below
            setStopPrice(currentPrice * 0.95);
            // Set default target at 15% above (1:3 R:R)
            setTargetPrice(currentPrice * 1.15);
        }
    }, [currentPrice]);

    const calculate = async () => {
        if (!entryPrice || !stopPrice) {
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/trading/risk/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountValue,
                    buyingPower,
                    entryPrice,
                    stopPrice,
                    targetPrice: targetPrice || undefined,
                    riskPercent,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setResult(data);
            }
        } catch (error) {
            console.error('Error calculating risk:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        calculate();
    }, [riskPercent, entryPrice, stopPrice, targetPrice]);

    const handleApply = () => {
        if (result?.recommended?.shares && onApplyToOrder) {
            onApplyToOrder(result.recommended.shares, stopPrice, targetPrice);
        }
    };

    return (
        <>
            <style>{`
                input[type=range] {
                    -webkit-appearance: none;
                    width: 100%;
                    background: transparent;
                }
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 16px;
                    width: 16px;
                    border-radius: 50%;
                    background: #4f46e5;
                    cursor: pointer;
                    margin-top: -6px;
                    box-shadow: 0 0 0 2px #1f2937;
                }
                input[type=range]::-webkit-slider-runnable-track {
                    width: 100%;
                    height: 4px;
                    cursor: pointer;
                    background: #374151;
                    border-radius: 2px;
                }
                .risk-input:focus {
                    border-color: #4f46e5 !important;
                    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2) !important;
                    outline: none;
                }
                .apply-btn {
                    background: linear-gradient(to bottom, #4f46e5, #4338ca) !important;
                    box-shadow: 0 4px 6px -1px rgba(67, 56, 202, 0.3), 0 2px 4px -1px rgba(67, 56, 202, 0.15);
                    transition: all 0.2s;
                }
                .apply-btn:hover {
                    background: linear-gradient(to bottom, #4338ca, #3730a3) !important;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 8px -1px rgba(67, 56, 202, 0.4), 0 4px 6px -1px rgba(67, 56, 202, 0.2);
                }
                .apply-btn:active {
                    transform: translateY(0);
                }
            `}</style>

            <div style={{
                backgroundColor: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '1rem',
                padding: '1.5rem'
            }}>
                <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'white'
                }}>
                    <Calculator size={20} color="#818cf8" />
                    Risk Calculator
                </h3>

                {/* Risk Percent Slider */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem'
                    }}>
                        <label style={{ fontSize: '0.875rem', color: '#8b949e' }}>Account Risk</label>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#818cf8' }}>{riskPercent}%</span>
                    </div>
                    <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.5"
                        value={riskPercent}
                        onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
                        style={{ width: '100%', marginBottom: '0.5rem' }}
                    />
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: '#6b7280'
                    }}>
                        <span>Conservative (0.5%)</span>
                        <span>Aggressive (5%)</span>
                    </div>
                </div>

                {/* Price Inputs */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '0.75rem',
                    marginBottom: '1.5rem'
                }}>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#8b949e', display: 'block', marginBottom: '0.25rem' }}>Entry Price</label>
                        <input
                            type="number"
                            value={entryPrice}
                            onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                            className="risk-input"
                            style={{
                                width: '100%',
                                backgroundColor: '#0d1117',
                                border: '1px solid #30363d',
                                borderRadius: '0.375rem',
                                padding: '0.5rem 0.75rem',
                                fontSize: '0.875rem',
                                color: 'white',
                                transition: 'all 0.2s'
                            }}
                            step="0.01"
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#8b949e', display: 'block', marginBottom: '0.25rem' }}>Stop Loss</label>
                        <input
                            type="number"
                            value={stopPrice}
                            onChange={(e) => setStopPrice(parseFloat(e.target.value) || 0)}
                            className="risk-input"
                            style={{
                                width: '100%',
                                backgroundColor: '#0d1117',
                                border: '1px solid #30363d',
                                borderRadius: '0.375rem',
                                padding: '0.5rem 0.75rem',
                                fontSize: '0.875rem',
                                color: 'white',
                                transition: 'all 0.2s'
                            }}
                            step="0.01"
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#8b949e', display: 'block', marginBottom: '0.25rem' }}>Take Profit</label>
                        <input
                            type="number"
                            value={targetPrice}
                            onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                            className="risk-input"
                            style={{
                                width: '100%',
                                backgroundColor: '#0d1117',
                                border: '1px solid #30363d',
                                borderRadius: '0.375rem',
                                padding: '0.5rem 0.75rem',
                                fontSize: '0.875rem',
                                color: 'white',
                                transition: 'all 0.2s'
                            }}
                            step="0.01"
                        />
                    </div>
                </div>

                {/* Results */}
                {result && result.recommended && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Position Size */}
                        <div style={{
                            backgroundColor: 'rgba(13, 17, 23, 0.5)',
                            borderRadius: '0.5rem',
                            padding: '0.75rem',
                            border: '1px solid #30363d'
                        }}>
                            <div style={{ fontSize: '0.75rem', color: '#8b949e', marginBottom: '0.25rem' }}>Recommended Position</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>
                                {result.recommended.shares} <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 400 }}>shares</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                ${result.recommended.positionValue.toFixed(2)} ({result.recommended.positionSizePercent.toFixed(1)}% of account)
                            </div>
                        </div>

                        {/* Risk/Reward */}
                        {result.riskReward && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                                <div style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    borderRadius: '0.5rem',
                                    padding: '0.5rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                                        <TrendingDown size={12} color="#f87171" />
                                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Risk</span>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f87171' }}>
                                        ${result.recommended.riskAmount.toFixed(2)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                        {result.riskReward.riskPercent.toFixed(1)}%
                                    </div>
                                </div>

                                <div style={{
                                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                    border: '1px solid rgba(34, 197, 94, 0.2)',
                                    borderRadius: '0.5rem',
                                    padding: '0.5rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                                        <TrendingUp size={12} color="#4ade80" />
                                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Reward</span>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#4ade80' }}>
                                        ${(result.riskReward.rewardAmount * result.recommended.shares).toFixed(2)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                        {result.riskReward.rewardPercent.toFixed(1)}%
                                    </div>
                                </div>

                                <div style={{
                                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                    borderRadius: '0.5rem',
                                    padding: '0.5rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                                        <DollarSign size={12} color="#818cf8" />
                                        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>R:R</span>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#818cf8' }}>
                                        1:{result.riskReward.ratio.toFixed(2)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                        {result.riskReward.ratio >= 2 ? 'Good' : 'Low'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Warnings */}
                        {result.recommended.errors && result.recommended.errors.length > 0 && (
                            <div style={{
                                backgroundColor: 'rgba(234, 179, 8, 0.1)',
                                border: '1px solid rgba(234, 179, 8, 0.2)',
                                borderRadius: '0.5rem',
                                padding: '0.75rem'
                            }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#facc15', marginBottom: '0.25rem' }}>⚠️ Warnings</div>
                                {result.recommended.errors.map((error: string, idx: number) => (
                                    <div key={idx} style={{ fontSize: '0.75rem', color: '#fde047' }}>
                                        • {error}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Apply Button */}
                        {onApplyToOrder && (
                            <button
                                onClick={handleApply}
                                className="apply-btn"
                                style={{
                                    width: '100%',
                                    padding: '0.625rem 1rem',
                                    borderRadius: '0.5rem',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '0.875rem',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                Apply to Order
                            </button>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
