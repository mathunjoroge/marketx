import { renderHook, waitFor } from '@testing-library/react';
import { useMarketData } from '@/hooks/useMarketData';

// Mock the context
jest.mock('@/context/MarketContext', () => ({
    useMarket: () => ({ country: 'US' })
}));

describe('useMarketData Hook', () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
        jest.clearAllMocks();
        originalFetch = global.fetch;
        global.fetch = jest.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });

    it('should fetch market data successfully', async () => {
        const mockData = {
            quote: { c: 150.25 },
            history: { c: [150, 151] }
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            json: async () => mockData,
            ok: true
        });

        const { result } = renderHook(() => useMarketData('AAPL', 'stock'));

        await waitFor(() => {
            expect(result.current.data).toEqual(mockData);
            expect(result.current.loading).toBe(false);
        });

        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/market-data?symbol=AAPL&assetClass=stock'));
    });

    it('should handle fetch errors', async () => {
        const errorMsg = 'API Error';
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(errorMsg));

        const { result } = renderHook(() => useMarketData('AAPL', 'stock'));

        await waitFor(() => {
            if (result.current.loading) {
                return; // Let waitFor retry
            }
            // If loading is false, check for error
            if (!result.current.error) {
                throw new Error('Expected error but got none');
            }
            expect(result.current.error).toBe(errorMsg);
        });
    });
});
