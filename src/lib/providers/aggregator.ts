import { MarketDataProvider, MarketQuote, HistoricalBar, AssetClass } from './types';
import { FinnhubAdapter } from './finnhub';
import { TwelveDataAdapter } from './twelvedata';
import { FMPAdapter } from './fmp';
import { EODHDAdapter } from './eodhd';
import { getCachedData, setCachedData } from '../redis';
import { formatSymbolForCountry } from '../exchanges';
import logger from '../logger';

/** Per-provider request timeout in milliseconds */
const PROVIDER_TIMEOUT_MS = 5000;

/** Race a promise against a timeout. Rejects with TimeoutError if exceeded. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout: ${label} exceeded ${ms}ms`)), ms)
        ),
    ]);
}

export interface MarketDataConfig {
    fmp?: string;
    finnhub?: string;
    eodhd?: string;
    twelveData?: string;
}

export class MarketDataAggregator {
    private providers: MarketDataProvider[];

    constructor(config?: MarketDataConfig) {
        this.providers = [];

        const finnhubKey = config?.finnhub || process.env.FINNHUB_API_KEY;
        const twelveDataKey = config?.twelveData || process.env.TWELVE_DATA_API_KEY;
        const fmpKey = config?.fmp || process.env.FMP_API_KEY;
        const eodhdKey = config?.eodhd || process.env.EODHD_API_KEY;

        if (finnhubKey) {
            this.providers.push(new FinnhubAdapter(finnhubKey));
        }
        if (twelveDataKey) {
            this.providers.push(new TwelveDataAdapter(twelveDataKey));
        }
        if (fmpKey) {
            this.providers.push(new FMPAdapter(fmpKey));
        }
        if (eodhdKey) {
            this.providers.push(new EODHDAdapter(eodhdKey));
        }

        if (this.providers.length === 0) {
            logger.warn('No market data providers configured. Using mock data.');
        }
    }

    private getMockQuote(symbol: string, assetClass: AssetClass): MarketQuote {
        return {
            symbol,
            price: 100 + Math.random() * 50,
            change: Math.random() * 5 - 2.5,
            changePercent: Math.random() * 2 - 1,
            high: 160,
            low: 140,
            open: 150,
            previousClose: 149,
            timestamp: Date.now(),
            assetClass,
            provider: 'Mock'
        };
    }

    private getMockHistory(limit: number, interval: string = '1d'): HistoricalBar[] {
        const intervalMsMap: Record<string, number> = {
            '5': 300000,
            '15': 900000,
            '30': 1800000,
            '60': 3600000,
            '240': 14400000,
            'D': 86400000,
            'W': 604800000,
            'M': 2592000000,
            '5m': 300000,
            '15m': 900000,
            '1h': 3600000,
            '4h': 14400000,
            '1d': 86400000,
            '1w': 604800000,
            '1mo': 2592000000,
        };
        const step = intervalMsMap[interval] || 86400000;

        return Array.from({ length: limit }).map((_, i) => ({
            time: Date.now() - (limit - i) * step,
            open: 150 + Math.random() * 10,
            high: 165 + Math.random() * 5,
            low: 145 - Math.random() * 5,
            close: 155 + Math.random() * 10,
            volume: 1000000 + Math.random() * 500000
        }));
    }

    async getQuote(symbol: string, assetClass: AssetClass, countryCode?: string): Promise<MarketQuote> {
        const formattedSymbol = countryCode ? formatSymbolForCountry(symbol, countryCode) : symbol;

        if (this.providers.length === 0) {
            return this.getMockQuote(formattedSymbol, assetClass);
        }
        const cacheKey = `quote:${formattedSymbol}`;
        const cached = await getCachedData<MarketQuote>(cacheKey);
        if (cached) return cached;

        for (const provider of this.providers) {
            try {
                const quote = await withTimeout(
                    provider.getQuote(formattedSymbol, assetClass),
                    PROVIDER_TIMEOUT_MS,
                    `${provider.name}.getQuote(${formattedSymbol})`
                );
                if (quote) {
                    await setCachedData(cacheKey, quote, 10);
                    return quote;
                }
            } catch (err) {
                logger.warn(`Provider ${provider.name} failed for ${formattedSymbol}, trying next...`);
            }
        }
        return this.getMockQuote(formattedSymbol, assetClass);
    }

    async getHistory(symbol: string, assetClass: AssetClass, interval: string = '1d', limit: number = 30, countryCode?: string): Promise<HistoricalBar[]> {
        const formattedSymbol = countryCode ? formatSymbolForCountry(symbol, countryCode) : symbol;

        if (this.providers.length === 0) {
            return this.getMockHistory(limit, interval);
        }
        const cacheKey = `history:${formattedSymbol}:${interval}:${limit}`;
        const cached = await getCachedData<HistoricalBar[]>(cacheKey);
        if (cached) return cached;

        for (const provider of this.providers) {
            try {
                const history = await withTimeout(
                    provider.getHistory(formattedSymbol, assetClass, interval, limit),
                    PROVIDER_TIMEOUT_MS,
                    `${provider.name}.getHistory(${formattedSymbol})`
                );
                if (history && history.length > 0) {
                    await setCachedData(cacheKey, history, 3600);
                    return history;
                }
            } catch (err) {
                logger.warn(`Provider ${provider.name} history failed for ${formattedSymbol}, trying next...`);
            }
        }

        return this.getMockHistory(limit, interval);
    }
}

export const marketData = new MarketDataAggregator();
