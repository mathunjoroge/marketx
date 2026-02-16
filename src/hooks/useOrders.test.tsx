import { renderHook, waitFor } from '@testing-library/react';
import { useOrders } from '@/hooks/useOrders';

global.fetch = jest.fn();

describe('useOrders Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should submit an order successfully', async () => {
        const mockResponse = {
            success: true,
            data: {
                message: 'Order placed',
                order: { id: '123', status: 'new' }
            }
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            json: async () => mockResponse,
            ok: true
        });

        const { result } = renderHook(() => useOrders());

        const orderData = {
            symbol: 'AAPL',
            qty: 10,
            side: 'buy' as const,
            type: 'market' as const,
            time_in_force: 'gtc' as const
        };

        const response = await result.current.submitOrder(orderData);

        expect(response.success).toBe(true);
        expect(response.message).toBe('Order placed');
        expect(result.current.lastOrder).toEqual(mockResponse.data.order);
        expect(global.fetch).toHaveBeenCalledWith('/api/trading/orders', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(orderData)
        }));
    });

    it('should handle order submission failure', async () => {
        const mockErrorResponse = {
            success: false,
            error: 'Insufficent funds'
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            json: async () => mockErrorResponse,
            ok: false
        });

        const { result } = renderHook(() => useOrders());

        const response = await result.current.submitOrder({
            symbol: 'AAPL',
            qty: 1000,
            side: 'buy',
            type: 'market',
            time_in_force: 'gtc'
        });

        expect(response.success).toBe(false);
        expect(response.error).toBe('Insufficent funds');
        expect(result.current.lastOrder).toBeNull();
    });
});
