import { renderHook, waitFor } from '@testing-library/react';
import { useAccount } from '@/hooks/useAccount';

// Mock fetch globally
global.fetch = jest.fn();

describe('useAccount Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should fetch account data successfully', async () => {
        const mockAccountData = {
            success: true,
            data: {
                account: {
                    id: '1',
                    buying_power: '10000',
                    cash: '5000',
                    portfolio_value: '15000',
                    equity: '15000'
                }
            }
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            json: async () => mockAccountData,
        });

        const { result } = renderHook(() => useAccount());

        expect(result.current.loading).toBe(true);
        expect(result.current.account).toBeNull();

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.account).toEqual(mockAccountData.data.account);
            expect(result.current.error).toBeNull();
        });
    });

    it('should handle API errors gracefully', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        const { result } = renderHook(() => useAccount());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
            expect(result.current.error).toBe('Network error');
            expect(result.current.account).toBeNull();
        });
    });

    it('should fetch specific position when symbol is provided', async () => {
        const mockAccountData = { success: true, data: { account: {} } };
        const mockPositionData = {
            success: true,
            data: {
                position: { symbol: 'AAPL', qty: '10', avg_entry_price: '150' }
            }
        };

        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({ json: async () => mockAccountData })
            .mockResolvedValueOnce({ json: async () => mockPositionData });

        const { result } = renderHook(() => useAccount({ symbol: 'AAPL' }));

        await waitFor(() => {
            expect(result.current.position).toEqual(mockPositionData.data.position);
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/trading/positions/AAPL');
    });

    it('should fetch all positions when fetchPositions is true', async () => {
        const mockAccountData = { success: true, data: { account: {} } };
        const mockPositionsData = {
            success: true,
            data: {
                positions: [
                    { symbol: 'AAPL', qty: '10' },
                    { symbol: 'GOOGL', qty: '5' }
                ]
            }
        };

        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({ json: async () => mockAccountData })
            .mockResolvedValueOnce({ json: async () => mockPositionsData });

        const { result } = renderHook(() => useAccount({ fetchPositions: true }));

        await waitFor(() => {
            expect(result.current.positions).toHaveLength(2);
            expect(result.current.positions[0].symbol).toBe('AAPL');
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/trading/positions');
    });
});
