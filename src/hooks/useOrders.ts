import { useState } from 'react';

export interface OrderRequest {
    symbol: string;
    qty: number;
    side: 'buy' | 'sell';
    type: 'market' | 'limit' | 'stop' | 'stop_limit';
    time_in_force: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
    limit_price?: number;
    stop_price?: number;
    trail_price?: number;
    trail_percent?: number;
    extended_hours?: boolean;
    client_order_id?: string;
    order_class?: 'simple' | 'bracket' | 'oco' | 'oto';
    take_profit?: {
        limit_price: number;
    };
    stop_loss?: {
        stop_price: number;
        limit_price?: number;
    };
}

interface OrderResponse {
    success: boolean;
    message?: string;
    order?: unknown;
    error?: string;
}

export function useOrders() {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastOrder, setLastOrder] = useState<unknown>(null);

    const submitOrder = async (orderData: OrderRequest): Promise<OrderResponse> => {
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch('/api/trading/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || data.error || 'Failed to submit order');
            }

            if (data.success) {
                const { order, message } = data.data;
                setLastOrder(order);
                return { success: true, message, order };
            } else {
                throw new Error(data.message || data.error || 'Order submission failed');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Error submitting order';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setSubmitting(false);
        }
    };

    return {
        submitOrder,
        submitting,
        error,
        lastOrder,
        reset: () => {
            setError(null);
            setLastOrder(null);
        }
    };
}
