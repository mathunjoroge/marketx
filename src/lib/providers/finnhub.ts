import axios from 'axios';
import { MarketDataProvider, MarketQuote, HistoricalBar, AssetClass } from './types';
import logger from '../logger';

// Maps our symbol format to Finnhub's expected format
const CRYPTO_SYMBOL_MAP: Record<string, string> = {
    'BTC/USD': 'BINANCE:BTCUSDT',
    'ETH/USD': 'BINANCE:ETHUSDT',
    'SOL/USD': 'BINANCE:SOLUSDT',
    'XRP/USD': 'BINANCE:XRPUSDT',
    'ADA/USD': 'BINANCE:ADAUSDT',
    'DOGE/USD': 'BINANCE:DOGEUSDT',
    'DOT/USD': 'BINANCE:DOTUSDT',
    'AVAX/USD': 'BINANCE:AVAXUSDT',
    'MATIC/USD': 'BINANCE:MATICUSDT',
    'LINK/USD': 'BINANCE:LINKUSDT',
    'LTC/USD': 'BINANCE:LTCUSDT',
    'UNI/USD': 'BINANCE:UNIUSDT',
    'ATOM/USD': 'BINANCE:ATOMUSDT',
};

export class FinnhubAdapter implements MarketDataProvider {
    name = 'Finnhub';
    private apiKey: string;
    private baseUrl = 'https://finnhub.io/api/v1';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Convert our generic symbol to Finnhub's expected format.
     * - Crypto: BTC/USD → BINANCE:BTCUSDT
     * - Forex: EUR/USD → OANDA:EUR_USD
     * - Stocks: pass through unchanged
     */
    private formatSymbol(symbol: string, assetClass: AssetClass): string {
        if (assetClass === 'crypto') {
            // Check our known map first
            if (CRYPTO_SYMBOL_MAP[symbol]) return CRYPTO_SYMBOL_MAP[symbol];
            // Generic fallback: BTC/USD → BINANCE:BTCUSDT
            const match = symbol.match(/^([A-Z]+)\/USD$/);
            if (match) return `BINANCE:${match[1]}USDT`;
            return symbol;
        }

        if (assetClass === 'forex') {
            // EUR/USD → OANDA:EUR_USD
            const match = symbol.match(/^([A-Z]+)\/([A-Z]+)$/);
            if (match) return `OANDA:${match[1]}_${match[2]}`;
            return symbol;
        }

        return symbol;
    }

    async getQuote(symbol: string, assetClass: AssetClass): Promise<MarketQuote> {
        try {
            const finnhubSymbol = this.formatSymbol(symbol, assetClass);

            // Use /quote for all asset types — Finnhub resolves BINANCE: and OANDA: prefixed symbols
            const response = await axios.get(`${this.baseUrl}/quote`, {
                params: { symbol: finnhubSymbol, token: this.apiKey },
            });

            const d = response.data;

            // If price is 0, this provider can't handle the symbol — throw to trigger fallback
            if ((!d.c && !d.o && !d.h) || d.c === 0) {
                throw new Error(`No data from Finnhub for ${finnhubSymbol}`);
            }


            return {
                symbol,
                price: d.c || 0,
                change: d.d || 0,
                changePercent: d.dp || 0,
                high: d.h || 0,
                low: d.l || 0,
                open: d.o || 0,
                previousClose: d.pc || 0,
                timestamp: d.t ? d.t * 1000 : Date.now(),
                assetClass,
                provider: this.name,
            };
        } catch (error) {
            logger.error(`Finnhub error for ${symbol}:`, error);
            throw error;
        }
    }

    async getHistory(symbol: string, assetClass: AssetClass, interval: string, limit: number): Promise<HistoricalBar[]> {
        try {
            const finnhubSymbol = this.formatSymbol(symbol, assetClass);
            const resolution = this.mapInterval(interval);
            const to = Math.floor(Date.now() / 1000);
            const from = to - (this.getIntervalSeconds(interval) * limit);

            let path = '/stock/candle';
            if (assetClass === 'crypto') path = '/crypto/candle';
            if (assetClass === 'forex') path = '/forex/candle';

            const response = await axios.get(`${this.baseUrl}${path}`, {
                params: { symbol: finnhubSymbol, resolution, from, to, token: this.apiKey },
            });

            const d = response.data;
            if (d.s !== 'ok') return [];

            return d.c.map((c: number, i: number) => ({
                time: d.t[i] * 1000,
                open: d.o[i],
                high: d.h[i],
                low: d.l[i],
                close: c,
                volume: d.v[i],
            }));
        } catch (error) {
            logger.error(`Finnhub history error for ${symbol}:`, error);
            throw error;
        }
    }

    private mapInterval(interval: string): string {
        const map: Record<string, string> = {
            '5m': '5',
            '15m': '15',
            '30m': '30',
            '1h': '60',
            '4h': '60', // Finnhub does not support 4h directly
            '1d': 'D',
            '1w': 'W',
            '1mo': 'M',
            '5': '5',
            '15': '15',
            '60': '60',
            '240': '60',
            'D': 'D',
            'W': 'W',
            'M': 'M'
        };
        return map[interval] || 'D';
    }

    private getIntervalSeconds(interval: string): number {
        const map: Record<string, number> = {
            '5m': 300,
            '15m': 900,
            '30m': 1800,
            '1h': 3600,
            '4h': 14400,
            '1d': 86400,
            '1w': 604800,
            '1mo': 2592000,
            '5': 300,
            '15': 900,
            '60': 3600,
            '240': 14400,
            'D': 86400,
            'W': 604800,
            'M': 2592000
        };
        return map[interval] || 86400;
    }
}
