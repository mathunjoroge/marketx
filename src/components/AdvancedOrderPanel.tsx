'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Settings } from 'lucide-react';
import RiskCalculator from './RiskCalculator';
import { useAccount } from '@/hooks/useAccount';
import { useOrders } from '@/hooks/useOrders';

interface AdvancedOrderPanelProps {
    symbol: string;
    currentPrice?: number;
    assetClass?: string;
}

export default function AdvancedOrderPanel({
    symbol,
    currentPrice = 0,
    assetClass = 'stock', // Future use, currently defaults to 'stock' logic
}: AdvancedOrderPanelProps) {
    // Form State
    const [activeTab, setActiveTab] = useState<'simple' | 'advanced'>('simple');
    const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
    const [side, setSide] = useState<'buy' | 'sell'>('buy');
    const [quantity, setQuantity] = useState(1);
    const [limitPrice, setLimitPrice] = useState(currentPrice);

    // Bracket Order State
    const [useBracketOrder, setUseBracketOrder] = useState(false);
    const [stopLossPrice, setStopLossPrice] = useState(0);
    const [takeProfitPrice, setTakeProfitPrice] = useState(0);

    // UI Feedback State
    const [message, setMessage] = useState('');

    // Custom Hooks
    const { account, position, refetch: refetchAccount } = useAccount({ pollInterval: 5000, symbol });
    const { submitOrder, submitting, error: submitError } = useOrders();

    // Default prices when currentPrice updates
    useEffect(() => {
        if (currentPrice > 0) {
            setLimitPrice(currentPrice);
            // Default stop at 5% below, target at 15% above
            setStopLossPrice(parseFloat((currentPrice * 0.95).toFixed(2)));
            setTakeProfitPrice(parseFloat((currentPrice * 1.15).toFixed(2)));
        }
    }, [currentPrice]);

    // Handle initial load or symbol change
    useEffect(() => {
        // Reset form when symbol changes
        setMessage('');
        setQuantity(1);
        setUseBracketOrder(false);
    }, [symbol]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        const orderRequest: any = {
            symbol,
            qty: quantity,
            side,
            type: orderType,
            time_in_force: 'gtc',
        };

        if (orderType === 'limit') {
            orderRequest.limit_price = limitPrice;
        }

        // Add bracket order fields if enabled
        if (useBracketOrder && stopLossPrice && takeProfitPrice) {
            orderRequest.order_class = 'bracket';
            orderRequest.take_profit = {
                limit_price: takeProfitPrice,
            };
            orderRequest.stop_loss = {
                stop_price: stopLossPrice,
            };
        }

        const result = await submitOrder(orderRequest);

        if (result.success) {
            setMessage(result.message || 'Order submitted successfully');
            // Reset quantity to 1 after success
            setQuantity(1);
            // Refresh account data immediately
            refetchAccount();
        } else {
            setMessage(`Error: ${submitError || result.error || 'Failed to submit order'}`);
        }
    };

    const handleApplyRiskCalculation = (shares: number, stop: number, target: number) => {
        setQuantity(shares);
        setStopLossPrice(stop);
        setTakeProfitPrice(target);
        setUseBracketOrder(true);
        setActiveTab('advanced');
    };

    const estimatedCost = orderType === 'market' ? currentPrice * quantity : limitPrice * quantity;
    const buyingPower = account ? parseFloat(account.buying_power) : 0;
    const equity = account ? parseFloat(account.equity) : 100000; // Default for risk calc if loading

    return (
        <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-6">
            <h2 className="text-xl font-bold mb-4">Trade {symbol}</h2>

            {/* Styles */}
            <style>{`
                .order-tab:hover, .order-type-btn:hover {
                    color: white !important;
                    background-color: rgba(255, 255, 255, 0.05);
                }
                .order-tab-active, .order-type-active {
                    background: linear-gradient(to bottom, #4f46e5, #4338ca) !important;
                    box-shadow: 0 4px 6px -1px rgba(67, 56, 202, 0.3), 0 2px 4px -1px rgba(67, 56, 202, 0.15);
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                    color: white !important;
                }
                .buy-btn {
                    background: linear-gradient(to bottom, #16a34a, #15803d) !important;
                    box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.3), 0 2px 4px -1px rgba(22, 163, 74, 0.15);
                    transition: all 0.2s;
                }
                .buy-btn:hover {
                    background: linear-gradient(to bottom, #15803d, #166534) !important;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 8px -1px rgba(22, 163, 74, 0.4), 0 4px 6px -1px rgba(22, 163, 74, 0.2);
                }
                .sell-btn {
                    background: linear-gradient(to bottom, #dc2626, #b91c1c) !important;
                    box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.3), 0 2px 4px -1px rgba(220, 38, 38, 0.15);
                    transition: all 0.2s;
                }
                .sell-btn:hover {
                    background: linear-gradient(to bottom, #b91c1c, #991b1b) !important;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 8px -1px rgba(220, 38, 38, 0.4), 0 4px 6px -1px rgba(220, 38, 38, 0.2);
                }
                .input-focus-effect:focus {
                    border-color: #4f46e5 !important;
                    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2) !important;
                    outline: none;
                }
            `}</style>

            {/* Tabs */}
            <div role="tablist" style={{
                display: 'flex', gap: '0.5rem', marginBottom: '1.5rem',
                backgroundColor: '#0d1117', padding: '0.25rem', borderRadius: '0.75rem', border: '1px solid #30363d'
            }}>
                <button
                    role="tab"
                    aria-selected={activeTab === 'simple'}
                    onClick={() => setActiveTab('simple')}
                    className={activeTab === 'simple' ? 'order-tab-active' : 'order-tab'}
                    style={{
                        flex: 1, padding: '0.625rem 0', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600,
                        transition: 'all 0.2s', color: activeTab === 'simple' ? 'white' : '#8b949e',
                        backgroundColor: activeTab === 'simple' ? '#4f46e5' : 'transparent', border: 'none', cursor: 'pointer'
                    }}
                >
                    Simple
                </button>
                <button
                    role="tab"
                    aria-selected={activeTab === 'advanced'}
                    onClick={() => setActiveTab('advanced')}
                    className={activeTab === 'advanced' ? 'order-tab-active' : 'order-tab'}
                    style={{
                        flex: 1, padding: '0.625rem 0', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600,
                        transition: 'all 0.2s', color: activeTab === 'advanced' ? 'white' : '#8b949e',
                        backgroundColor: activeTab === 'advanced' ? '#4f46e5' : 'transparent', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem'
                    }}
                >
                    <Settings className="w-4 h-4" />
                    Advanced
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Order Type */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <label className="text-xs text-gray-400 block mb-2 font-semibold uppercase tracking-wider">Order Type</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.625rem' }}>
                        <button
                            type="button"
                            onClick={() => setOrderType('market')}
                            className={orderType === 'market' ? 'order-type-active' : 'order-type-btn'}
                            style={{
                                padding: '0.625rem 1rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem',
                                transition: 'all 0.2s', color: orderType === 'market' ? 'white' : '#8b949e',
                                backgroundColor: orderType === 'market' ? '#4f46e5' : '#0d1117',
                                border: orderType === 'market' ? 'none' : '1px solid #30363d', cursor: 'pointer'
                            }}
                        >
                            Market
                        </button>
                        <button
                            type="button"
                            onClick={() => setOrderType('limit')}
                            className={orderType === 'limit' ? 'order-type-active' : 'order-type-btn'}
                            style={{
                                padding: '0.625rem 1rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.875rem',
                                transition: 'all 0.2s', color: orderType === 'limit' ? 'white' : '#8b949e',
                                backgroundColor: orderType === 'limit' ? '#4f46e5' : '#0d1117',
                                border: orderType === 'limit' ? 'none' : '1px solid #30363d', cursor: 'pointer'
                            }}
                        >
                            Limit
                        </button>
                    </div>
                </div>

                {/* Quantity */}
                <div style={{ marginBottom: '1.25rem' }}>
                    <label htmlFor="quantity" className="text-xs text-gray-400 block mb-2 font-semibold uppercase tracking-wider">Quantity</label>
                    <input
                        id="quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        className="input-focus-effect w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 text-sm text-white font-medium transition-all"
                        required
                    />
                </div>

                {/* Limit Price Input */}
                {orderType === 'limit' && (
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label htmlFor="limitPrice" className="text-xs text-gray-400 block mb-2 font-semibold uppercase tracking-wider">Limit Price</label>
                        <input
                            id="limitPrice"
                            type="number"
                            value={limitPrice}
                            onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                            step="0.01"
                            className="input-focus-effect w-full bg-[#0d1117] border border-[#30363d] rounded-lg p-2.5 text-sm text-white font-medium transition-all"
                            required
                        />
                    </div>
                )}

                {/* Advanced Options (Bracket + Risk Calc) */}
                {activeTab === 'advanced' && (
                    <div className="mb-4 mt-4 bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <input
                                type="checkbox"
                                id="bracketOrder"
                                checked={useBracketOrder}
                                onChange={(e) => setUseBracketOrder(e.target.checked)}
                                className="w-4 h-4 accent-indigo-600 cursor-pointer"
                            />
                            <label htmlFor="bracketOrder" className="text-sm font-bold text-gray-300 cursor-pointer">
                                Enable Bracket Order
                            </label>
                        </div>

                        {useBracketOrder && (
                            <div className="flex flex-col gap-3">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Stop-Loss Price</label>
                                    <input
                                        type="number"
                                        value={stopLossPrice}
                                        onChange={(e) => setStopLossPrice(parseFloat(e.target.value) || 0)}
                                        step="0.01"
                                        className="input-focus-effect w-full bg-gray-900 border border-red-900/50 rounded p-2 text-sm text-white"
                                        placeholder="Stop price"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">Take-Profit Price</label>
                                    <input
                                        type="number"
                                        value={takeProfitPrice}
                                        onChange={(e) => setTakeProfitPrice(parseFloat(e.target.value) || 0)}
                                        step="0.01"
                                        className="input-focus-effect w-full bg-gray-900 border border-green-900/50 rounded p-2 text-sm text-white"
                                        placeholder="Target price"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-800">
                            <RiskCalculator
                                currentPrice={currentPrice}
                                accountValue={equity}
                                buyingPower={buyingPower}
                                onApplyToOrder={handleApplyRiskCalculation}
                            />
                        </div>
                    </div>
                )}

                {/* Estimated Cost & Buying Power */}
                <div className="mb-6 bg-[#0d1117] rounded-xl p-4 border border-[#30363d]">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-400 font-medium">Estimated Cost</span>
                        <span className="text-lg font-bold text-white">${estimatedCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400 font-medium">Buying Power</span>
                        <span className="text-sm text-gray-300 font-mono">${buyingPower.toFixed(2)}</span>
                    </div>
                </div>

                {/* Current Position Display */}
                {position && (
                    <div className="mb-6 bg-slate-800/30 border border-slate-600/40 rounded-xl p-4">
                        <div className="text-[11px] text-gray-400 mb-2 font-semibold uppercase tracking-wider">Current Position</div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-200 font-medium">
                                {position.qty} shares @ ${parseFloat(position.avg_entry_price).toFixed(2)}
                            </span>
                            <span className={`text-sm font-bold ${parseFloat(position.unrealized_pl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {parseFloat(position.unrealized_pl) >= 0 ? '+' : ''}${parseFloat(position.unrealized_pl).toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}

                {/* Submit Buttons */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                        type="submit"
                        onClick={() => setSide('buy')}
                        disabled={submitting}
                        className="buy-btn flex items-center justify-center gap-2 p-3.5 rounded-xl text-white font-bold text-base disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {submitting && side === 'buy' ? 'Submitting...' : <><TrendingUp size={20} /> Buy</>}
                    </button>
                    <button
                        type="submit"
                        onClick={() => setSide('sell')}
                        disabled={submitting}
                        className="sell-btn flex items-center justify-center gap-2 p-3.5 rounded-xl text-white font-bold text-base disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {submitting && side === 'sell' ? 'Submitting...' : <><TrendingDown size={20} /> Sell</>}
                    </button>
                </div>

                {/* Message */}
                {message && (
                    <div className={`p-3 rounded-lg text-sm ${message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')
                        ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                        : 'bg-green-500/20 border border-green-500/50 text-green-300'
                        }`}>
                        {message}
                    </div>
                )}
            </form>
        </div>
    );
}
