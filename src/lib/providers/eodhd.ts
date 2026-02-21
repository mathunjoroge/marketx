import axios from 'axios';
import { MarketDataProvider, MarketQuote, HistoricalBar, AssetClass } from './types';
import logger from '../logger';

export class EODHDAdapter implements MarketDataProvider {
    name = 'EODHD';
    private apiKey: string;
    private baseUrl = 'https://eodhd.com/api';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async getQuote(symbol: string, assetClass: AssetClass): Promise<MarketQuote> {
        try {
            // EODHD real-time quote: /real-time/AAPL.US?api_token=OE6060...&fmt=json
            const response = await axios.get(`${this.baseUrl}/real-time/${symbol}`, {
                params: { api_token: this.apiKey, fmt: 'json' },
            });

            const d = response.data;
            if (!d || d.code === '404') throw new Error('No data found');

            return {
                symbol,
                price: parseFloat(d.close) || 0,
                change: parseFloat(d.change) || 0,
                changePercent: parseFloat(d.change_p) || 0,
                high: parseFloat(d.high) || 0,
                low: parseFloat(d.low) || 0,
                open: parseFloat(d.open) || 0,
                previousClose: parseFloat(d.previousClose) || 0,
                timestamp: d.timestamp ? d.timestamp * 1000 : Date.now(),
                assetClass,
                provider: this.name,
            };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error(`EODHD error for ${symbol}:`, { error: errorMessage });
            throw error;
        }
    }

    async getHistory(symbol: string, assetClass: AssetClass, interval: string, limit: number): Promise<HistoricalBar[]> {
        try {
            // EODHD historical: /eod/AAPL.US?from=2017-01-05&to=2017-02-10&period=d&fmt=json
            const period = this.mapInterval(interval);
            const response = await axios.get(`${this.baseUrl}/eod/${symbol}`, {
                params: {
                    api_token: this.apiKey,
                    fmt: 'json',
                    period: period,
                    limit: limit
                },
            });

            const bars = response.data || [];
            if (!Array.isArray(bars)) return [];

            interface EODHDBar {
                date: string;
                open: number;
                high: number;
                low: number;
                close: number;
                volume?: number;
            }

            return (bars as EODHDBar[]).slice(-limit).map((v: EODHDBar) => ({
                time: new Date(v.date).getTime(),
                open: v.open,
                high: v.high,
                low: v.low,
                close: v.close,
                volume: v.volume || 0,
            }));
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger.error(`EODHD history error for ${symbol}:`, { error: errorMessage });
            throw error;
        }
    }

    private mapInterval(interval: string): string {
        const map: Record<string, string> = {
            '1d': 'd',
            'D': 'd',
            '1w': 'w',
            'W': 'w',
            '1mo': 'm',
            'M': 'm'
        };
        return map[interval] || 'd';
    }
}
