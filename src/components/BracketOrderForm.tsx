'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Target, AlertTriangle, Check, X } from 'lucide-react';
import RiskCalculator from './RiskCalculator';

interface BracketOrderFormProps {
    symbol: string;
    currentPrice: number;
    accountValue?: number;
    buyingPower?: number;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function BracketOrderForm({
    symbol,
    currentPrice,
    accountValue = 100000,
    buyingPower = 200000,
    onClose,
    onSuccess
}: BracketOrderFormProps) {
    const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
    const [side, setSide] = useState<'buy' | 'sell'>('buy');
    const [qty, setQty] = useState(10);
    const [limitPrice, setLimitPrice] = useState(currentPrice);
    const [stopLoss, setStopLoss] = useState(currentPrice * 0.95);
    const [takeProfit, setTakeProfit] = useState(currentPrice * 1.15);
    const [useStopLimit, setUseStopLimit] = useState(false);
    const [stopLimitPrice, setStopLimitPrice] = useState(stopLoss * 0.995);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Update prices when current price changes
    useEffect(() => {
        if (orderType === 'market') {
            setLimitPrice(currentPrice);
        }
        setStopLoss(currentPrice * 0.95);
        setTakeProfit(currentPrice * 1.15);
    }, [currentPrice, orderType]);

    if (!mounted) return null;

    // Calculate risk/reward ratio
    const entryPrice = orderType === 'market' ? currentPrice : limitPrice;
    const riskPerShare = side === 'buy'
        ? entryPrice - stopLoss
        : stopLoss - entryPrice;
    const rewardPerShare = side === 'buy'
        ? takeProfit - entryPrice
        : entryPrice - takeProfit;
    const riskRewardRatio = riskPerShare > 0 ? rewardPerShare / riskPerShare : 0;

    // Calculate dollar amounts
    const totalRisk = riskPerShare * qty;
    const totalReward = rewardPerShare * qty;
    const positionValue = entryPrice * qty;

    // Validate order
    const validateOrder = (): string | null => {
        if (qty <= 0) return 'Quantity must be greater than 0';
        if (orderType === 'limit' && limitPrice <= 0) return 'Limit price must be greater than 0';

        if (side === 'buy') {
            if (stopLoss >= entryPrice) return 'Stop loss must be below entry price for buy orders';
            if (takeProfit <= entryPrice) return 'Take profit must be above entry price for buy orders';
        } else {
            if (stopLoss <= entryPrice) return 'Stop loss must be above entry price for sell orders';
            if (takeProfit >= entryPrice) return 'Take profit must be below entry price for sell orders';
        }

        if (positionValue > buyingPower) return `Position value ($${positionValue.toFixed(2)}) exceeds buying power ($${buyingPower.toFixed(2)})`;

        return null;
    };

    const handleSubmit = async () => {
        const validationError = validateOrder();
        if (validationError) {
            setError(validationError);
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/trading/bracket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol,
                    qty,
                    side,
                    type: orderType,
                    limit_price: orderType === 'limit' ? limitPrice : undefined,
                    take_profit: {
                        limit_price: takeProfit
                    },
                    stop_loss: {
                        stop_price: stopLoss,
                        limit_price: useStopLimit ? stopLimitPrice : undefined
                    },
                    time_in_force: 'gtc'
                })
            });

            const data = await response.json();

            if (data.success) {
                onSuccess?.();
                onClose();
            } else {
                setError(data.error || 'Failed to submit bracket order');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Network error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApplyRecommendation = (shares: number, stop: number, target: number) => {
        setQty(shares);
        setStopLoss(stop);
        setTakeProfit(target);
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div style={{
                backgroundColor: 'rgba(13, 17, 23, 0.95)',
                backdropFilter: 'blur(16px)',
                border: '1px solid #30363d',
                borderRadius: '1rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column'
            }} className="max-w-4xl w-full max-h-[90vh] overflow-hidden">

                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #30363d',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'rgba(13, 17, 23, 0.5)'
                }}>
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                            <Target className="w-6 h-6 text-indigo-400" />
                            Bracket Order
                        </h2>
                        <p className="text-sm text-gray-400 mt-1 font-mono">
                            {symbol} <span className="text-gray-600">|</span> <span className="text-gray-300">${currentPrice.toFixed(2)}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close bracket order form"
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Side - Order Entry */}
                    <div className="space-y-6">
                        {/* Order Type & Side */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Order Type</label>
                                <div className="flex bg-gray-900/50 p-1 rounded-lg border border-gray-700/50">
                                    <button
                                        onClick={() => setOrderType('market')}
                                        className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${orderType === 'market'
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                                            : 'text-gray-400 hover:text-gray-200'
                                            }`}
                                    >
                                        Market
                                    </button>
                                    <button
                                        onClick={() => setOrderType('limit')}
                                        className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${orderType === 'limit'
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                                            : 'text-gray-400 hover:text-gray-200'
                                            }`}
                                    >
                                        Limit
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Side</label>
                                <div className="flex bg-gray-900/50 p-1 rounded-lg border border-gray-700/50">
                                    <button
                                        onClick={() => setSide('buy')}
                                        className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${side === 'buy'
                                            ? 'bg-green-600 text-white shadow-lg shadow-green-900/50'
                                            : 'text-gray-400 hover:text-gray-200'
                                            }`}
                                    >
                                        Buy
                                    </button>
                                    <button
                                        onClick={() => setSide('sell')}
                                        className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${side === 'sell'
                                            ? 'bg-red-600 text-white shadow-lg shadow-red-900/50'
                                            : 'text-gray-400 hover:text-gray-200'
                                            }`}
                                    >
                                        Sell
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Quantity & Entry Price */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="qty" className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Quantity</label>
                                <input
                                    id="qty"
                                    type="number"
                                    value={qty}
                                    onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                                    className="w-full bg-[#0d1117] border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                                    min="1"
                                />
                            </div>
                            {orderType === 'limit' && (
                                <div>
                                    <label htmlFor="limitPrice" className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Limit Price</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                        <input
                                            id="limitPrice"
                                            type="number"
                                            value={limitPrice}
                                            onChange={(e) => setLimitPrice(parseFloat(e.target.value) || 0)}
                                            className="w-full bg-[#0d1117] border border-gray-700 rounded-lg pl-7 pr-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Stop Loss */}
                        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                            <label htmlFor="stopLoss" className="text-xs font-bold text-red-400 uppercase tracking-wider block mb-2">Stop Loss</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-red-500/50">$</span>
                                <input
                                    id="stopLoss"
                                    type="number"
                                    value={stopLoss}
                                    onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-[#0d1117] border border-red-900/30 rounded-lg pl-7 pr-4 py-2.5 text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono"
                                    step="0.01"
                                />
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="use-stop-limit"
                                    checked={useStopLimit}
                                    onChange={(e) => setUseStopLimit(e.target.checked)}
                                    className="rounded border-gray-700 bg-gray-900 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="use-stop-limit" className="text-xs text-gray-400 select-none cursor-pointer">
                                    Use stop-limit (trigger limit order)
                                </label>
                            </div>
                            {useStopLimit && (
                                <div className="mt-2 relative animate-in fade-in slide-in-from-top-1">
                                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        value={stopLimitPrice}
                                        onChange={(e) => setStopLimitPrice(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-[#0d1117] border border-gray-700 rounded-lg pl-7 pr-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                                        step="0.01"
                                        placeholder="Limit price"
                                        aria-label="Stop limit price"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Take Profit */}
                        <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                            <label htmlFor="takeProfit" className="text-xs font-bold text-green-400 uppercase tracking-wider block mb-2">Take Profit</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-green-500/50">$</span>
                                <input
                                    id="takeProfit"
                                    type="number"
                                    value={takeProfit}
                                    onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-[#0d1117] border border-green-900/30 rounded-lg pl-7 pr-4 py-2.5 text-white focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-mono"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        {/* Risk/Reward Summary */}
                        <div role="region" aria-label="Order Summary" className="bg-gray-900/30 border border-gray-800 rounded-xl p-5 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Position Value</span>
                                <span className="font-mono font-medium text-white">${positionValue.toFixed(2)}</span>
                            </div>
                            <div className="h-px bg-gray-800/50"></div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Max Risk</span>
                                <span className="font-mono font-bold text-red-400">-${totalRisk.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Potential Reward</span>
                                <span className="font-mono font-bold text-green-400">+${totalReward.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-1">
                                <span className="text-gray-400">R:R Ratio</span>
                                <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${riskRewardRatio >= 2 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'}`}>
                                    1:{riskRewardRatio.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                <span className="text-sm text-red-400">{error}</span>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !!validateOrder()}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2 hover:translate-y-[-1px] active:translate-y-[0px]"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    Submit Bracket Order
                                </>
                            )}
                        </button>
                    </div>

                    {/* Right Side - Risk Calculator */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl pointer-events-none"></div>
                        <div className="relative z-10 h-full">
                            <RiskCalculator
                                currentPrice={entryPrice}
                                accountValue={accountValue}
                                buyingPower={buyingPower}
                                onApplyToOrder={handleApplyRecommendation}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
