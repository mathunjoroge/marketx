'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useAccount } from '@/hooks/useAccount';
import { useOrders, OrderRequest } from '@/hooks/useOrders';

interface TradingPanelProps {
    symbol: string;
    currentPrice?: number;
    assetClass: string;
}

export default function TradingPanel({ symbol, currentPrice = 0 }: TradingPanelProps) {
    const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
    const [side, setSide] = useState<'buy' | 'sell'>('buy');
    const [qty, setQty] = useState<string>('1');
    const [limitPrice, setLimitPrice] = useState<string>('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Hooks
    const { account, position, refetch } = useAccount({ symbol, pollInterval: 0 });
    const { submitOrder, submitting } = useOrders();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        const orderData: OrderRequest = {
            symbol,
            qty: parseInt(qty),
            side,
            type: orderType,
            time_in_force: 'gtc',
        };

        if (orderType === 'limit') {
            orderData.limit_price = parseFloat(limitPrice);
        }

        try {
            const result = await submitOrder(orderData);

            if (result.success) {
                setMessage({ type: 'success', text: result.message || 'Order submitted successfully!' });
                setQty('1');
                setLimitPrice('');
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to submit order' });
            }
        } catch (err: unknown) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'An unexpected error occurred.' });
        } finally {
            // Refresh account/position data regardless of success or failure
            refetch();
        }
    };

    const estimatedCost = orderType === 'limit'
        ? parseFloat(limitPrice || '0') * parseInt(qty || '0')
        : (currentPrice || 0) * parseInt(qty || '0');

    const buyingPower = account ? parseFloat(account.buying_power) : 0;

    return (
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Trade {symbol}</h3>
                {position && (
                    <div className="text-sm text-gray-400">
                        Position: <span className="text-white font-semibold">{(position.qty || 0).toLocaleString()} shares</span>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Order Type Selector */}
                <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">Order Type</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setOrderType('market')}
                            className={`px-4 py-3 rounded-lg font-bold transition-all ${orderType === 'market'
                                ? 'bg-indigo-600 text-white shadow-lg border-2 border-indigo-500'
                                : 'bg-gray-800 text-gray-400 hover:text-gray-200 border-2 border-gray-700'
                                }`}
                        >
                            Market
                        </button>
                        <button
                            type="button"
                            onClick={() => setOrderType('limit')}
                            className={`px-4 py-3 rounded-lg font-bold transition-all ${orderType === 'limit'
                                ? 'bg-indigo-600 text-white shadow-lg border-2 border-indigo-500'
                                : 'bg-gray-800 text-gray-400 hover:text-gray-200 border-2 border-gray-700'
                                }`}
                        >
                            Limit
                        </button>
                    </div>
                </div>

                {/* Quantity Input */}
                <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">Quantity</label>
                    <input
                        type="number"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        min="1"
                        step="1"
                        required
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                {/* Limit Price Input (shown only for limit orders) */}
                {orderType === 'limit' && (
                    <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wide">Limit Price</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-gray-500">$</span>
                            <input
                                type="number"
                                value={limitPrice}
                                onChange={(e) => setLimitPrice(e.target.value)}
                                min="0.01"
                                step="0.01"
                                required
                                placeholder={currentPrice?.toFixed(2) || '0.00'}
                                className="w-full pl-8 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                )}

                {/* Estimated Cost */}
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-400">Estimated Cost</span>
                        <span className="text-lg font-bold text-white">${estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Buying Power</span>
                        <span className="text-sm font-semibold text-gray-300">${buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                </div>

                {/* Buy/Sell Buttons */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="submit"
                        onClick={() => setSide('buy')}
                        disabled={submitting}
                        className="px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <TrendingUp className="w-5 h-5" />
                        {submitting && side === 'buy' ? 'Submitting...' : 'Buy'}
                    </button>
                    <button
                        type="submit"
                        onClick={() => setSide('sell')}
                        disabled={submitting}
                        className="px-6 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        <TrendingDown className="w-5 h-5" />
                        {submitting && side === 'sell' ? 'Submitting...' : 'Sell'}
                    </button>
                </div>

                {/* Message Display */}
                {message && (
                    <div
                        className={`p-4 rounded-lg ${message.type === 'success'
                            ? 'bg-green-900/20 border border-green-700 text-green-400'
                            : 'bg-red-900/20 border border-red-700 text-red-400'
                            }`}
                    >
                        {message.text}
                    </div>
                )}
            </form>
        </div>
    );
}
