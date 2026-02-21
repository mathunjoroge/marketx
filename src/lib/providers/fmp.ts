import axios from 'axios';
import { MarketDataProvider, MarketQuote, HistoricalBar, AssetClass } from './types';
import logger from '../logger';

export class FMPAdapter implements MarketDataProvider {
    name = 'Financial Modeling Prep';
    private apiKey: string;
    private baseUrl = 'https://financialmodelingprep.com';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Format symbol for FMP: strip slashes from forex/crypto pairs 
     * EUR/USD → EURUSD,  BTC/USD → BTCUSD
     */
    private formatSymbol(symbol: string): string {
        return symbol.replace('/', '');
    }

    async getQuote(symbol: string, assetClass: AssetClass): Promise<MarketQuote> {
        try {
            const fmpSymbol = this.formatSymbol(symbol);

            // Use the new stable API endpoint
            const response = await axios.get(`${this.baseUrl}/stable/quote`, {
                params: { symbol: fmpSymbol, apikey: this.apiKey },
            });

            const d = Array.isArray(response.data) ? response.data[0] : response.data;
            if (!d) throw new Error('No data found');

            return {
                symbol,
                price: d.price || 0,
                change: d.change || 0,
                changePercent: d.changePercentage || d.changesPercentage || 0,
                high: d.dayHigh || 0,
                low: d.dayLow || 0,
                open: d.open || 0,
                previousClose: d.previousClose || 0,
                timestamp: d.timestamp ? d.timestamp * 1000 : Date.now(),
                assetClass,
                provider: this.name,
            };
        } catch (err: unknown) {
            logger.error(`FMP error for ${symbol}:`, err);
            throw err;
        }
    }

    async getHistory(symbol: string, assetClass: AssetClass, interval: string, limit: number): Promise<HistoricalBar[]> {
        try {
            // Map interval to FMP format
            // FMP supports 1min, 5min, 15min, 30min, 1hour, 4hour, daily
            let endpoint = '';
            if (interval === '1d' || interval === 'D') {
                endpoint = `stable/historical-price-full/${symbol}`;
            } else if (interval === '1w' || interval === 'W') {
                endpoint = `stable/historical-price-full/${symbol}?serietype=line`; // simple daily for weekly
            } else if (interval === '1mo' || interval === 'M') {
                endpoint = `stable/historical-price-full/${symbol}?serietype=line`;
            } else {
                const fmpInterval = this.mapInterval(interval);
                endpoint = `stable/historical-chart/${fmpInterval}/${symbol}`;
            }

            const response = await axios.get(`${this.baseUrl}/${endpoint}`, {
                params: { apikey: this.apiKey },
            });

            interface FMPHistoricalBar {
                date: string;
                open: number;
                high: number;
                low: number;
                close: number;
                volume: number;
            }

            let bars: FMPHistoricalBar[] = [];
            if (interval === '1d') {
                bars = response.data.historical || [];
            } else {
                bars = response.data || [];
            }

            return bars.slice(0, limit).map((v: FMPHistoricalBar) => ({
                time: new Date(v.date).getTime(),
                open: v.open,
                high: v.high,
                low: v.low,
                close: v.close,
                volume: v.volume || 0,
            })).reverse(); // FMP returns newest first
        } catch (err: unknown) {
            logger.error(`FMP history error for ${symbol}:`, err);
            throw err;
        }
    }

    private mapInterval(interval: string): string {
        const map: Record<string, string> = {
            '5m': '5min',
            '15m': '15min',
            '30m': '30min',
            '1h': '1hour',
            '4h': '4hour',
            '5': '5min',
            '15': '15min',
            '60': '1hour',
            '240': '4hour'
        };
        return map[interval] || '1hour';
    }
}
