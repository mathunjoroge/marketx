import { FinnhubAdapter } from '../src/lib/providers/finnhub';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../src/lib/logger', () => ({
    error: jest.fn(),
    info: jest.fn(),
}));

describe('FinnhubAdapter', () => {
    const adapter = new FinnhubAdapter('test_key');

    it('should fetch a quote correctly', async () => {
        mockedAxios.get.mockResolvedValue({
            data: {
                c: 150.23,
                d: 1.25,
                dp: 0.85,
                h: 151,
                l: 149,
                o: 149.5,
                pc: 148.98,
                t: 1625234400
            }
        });

        const quote = await adapter.getQuote('AAPL', 'stock');
        expect(quote.symbol).toBe('AAPL');
        expect(quote.price).toBe(150.23);
        expect(quote.provider).toBe('Finnhub');
    });

    it('should handle errors gracefully', async () => {
        mockedAxios.get.mockRejectedValue(new Error('API Error'));
        await expect(adapter.getQuote('AAPL', 'stock')).rejects.toThrow('API Error');
    });
});
