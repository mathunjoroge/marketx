'use client';

import { useState } from 'react';
import { TrendingUp, AlertTriangle, Check, X, Info } from 'lucide-react';

interface TrailingStopFormProps {
    symbol: string;
    currentPrice: number;
    positionQty: number;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function TrailingStopForm({
    symbol,
    currentPrice,
    positionQty,
    onClose,
    onSuccess
}: TrailingStopFormProps) {
    const [trailType, setTrailType] = useState<'percent' | 'price'>('percent');
    const [trailPercent, setTrailPercent] = useState(2.5);
    const [trailPrice, setTrailPrice] = useState(5.0);
    const [qty, setQty] = useState(positionQty);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Calculate current stop price based on trail settings
    const currentStopPrice = trailType === 'percent'
        ? currentPrice * (1 - trailPercent / 100)
        : currentPrice - trailPrice;

    // Example future price scenarios
    const examplePrices = [
        { label: 'Current', price: currentPrice, stop: currentStopPrice },
        { label: '+5%', price: currentPrice * 1.05, stop: trailType === 'percent' ? currentPrice * 1.05 * (1 - trailPercent / 100) : (currentPrice * 1.05) - trailPrice },
        { label: '+10%', price: currentPrice * 1.10, stop: trailType === 'percent' ? currentPrice * 1.10 * (1 - trailPercent / 100) : (currentPrice * 1.10) - trailPrice },
    ];

    const validateOrder = (): string | null => {
        if (qty <= 0) return 'Quantity must be greater than 0';
        if (qty > positionQty) return `Quantity exceeds position size (${positionQty})`;

        if (trailType === 'percent') {
            if (trailPercent < 0.1) return 'Trail percent must be at least 0.1%';
            if (trailPercent > 50) return 'Trail percent cannot exceed 50%';
        } else {
            if (trailPrice <= 0) return 'Trail price must be greater than 0';
            if (trailPrice >= currentPrice) return 'Trail price must be less than current price';
        }

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
            const response = await fetch('/api/trading/trailing-stop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol,
                    qty,
                    trail_percent: trailType === 'percent' ? trailPercent : undefined,
                    trail_price: trailType === 'price' ? trailPrice : undefined
                })
            });

            const data = await response.json();

            if (data.success) {
                onSuccess?.();
                onClose();
            } else {
                setError(data.error || 'Failed to submit trailing stop order');
            }
        } catch (err: any) {
            setError(err.message || 'Network error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0d1117] border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-[#0d1117] border-b border-gray-800 p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-blue-400" />
                            Trailing Stop
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                            {symbol} @ ${currentPrice.toFixed(2)} • Position: {positionQty} shares
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Info Banner */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-300">
                            <p className="font-semibold mb-1">How Trailing Stops Work:</p>
                            <p>The stop price automatically adjusts upward as the market price rises, locking in profits while protecting against downside moves.</p>
                        </div>
                    </div>

                    {/* Trail Type Selection */}
                    <div>
                        <label className="text-xs text-gray-400 block mb-2">Trail Type</label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setTrailType('percent')}
                                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${trailType === 'percent'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                Percentage
                            </button>
                            <button
                                onClick={() => setTrailType('price')}
                                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${trailType === 'price'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    }`}
                            >
                                Dollar Amount
                            </button>
                        </div>
                    </div>

                    {/* Trail Configuration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-400 block mb-2">Quantity</label>
                            <input
                                type="number"
                                value={qty}
                                onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2"
                                min="1"
                                max={positionQty}
                            />
                        </div>
                        {trailType === 'percent' ? (
                            <div>
                                <label className="text-xs text-gray-400 block mb-2">Trail Percent (%)</label>
                                <input
                                    type="number"
                                    value={trailPercent}
                                    onChange={(e) => setTrailPercent(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-gray-900 border border-blue-900/30 rounded-lg px-4 py-2"
                                    step="0.5"
                                    min="0.1"
                                    max="50"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="text-xs text-gray-400 block mb-2">Trail Amount ($)</label>
                                <input
                                    type="number"
                                    value={trailPrice}
                                    onChange={(e) => setTrailPrice(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-gray-900 border border-blue-900/30 rounded-lg px-4 py-2"
                                    step="0.1"
                                    min="0.01"
                                />
                            </div>
                        )}
                    </div>

                    {/* Visual Example */}
                    <div className="bg-gray-900/50 rounded-lg p-4">
                        <div className="text-sm font-semibold text-gray-300 mb-3">Trail Preview</div>
                        <div className="space-y-2">
                            {examplePrices.map((scenario, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">{scenario.label}:</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-white font-mono">
                                            ${scenario.price.toFixed(2)}
                                        </span>
                                        <span className="text-gray-500">→</span>
                                        <span className="text-blue-400 font-mono">
                                            Stop: ${scenario.stop.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500">
                            As price rises, stop automatically moves up. If price falls, stop stays put.
                        </div>
                    </div>

                    {/* Current Stop Price Highlight */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Initial Stop Price:</span>
                            <span className="text-xl font-bold text-blue-400">
                                ${currentStopPrice.toFixed(2)}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            ({trailType === 'percent' ? `${trailPercent}%` : `$${trailPrice.toFixed(2)}`} below current price)
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                            <span className="text-sm text-red-400">{error}</span>
                        </div>
                    )}

                    {/* Submit Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !!validateOrder()}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Check className="w-5 h-5" />
                                    Set Trailing Stop
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
