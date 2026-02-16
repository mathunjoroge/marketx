import axios from 'axios';
import { MarketDataProvider, MarketQuote, HistoricalBar, AssetClass } from './types';
import logger from '../logger';

export class TwelveDataAdapter implements MarketDataProvider {
    name = 'Twelve Data';
    private apiKey: string;
    private baseUrl = 'https://api.twelvedata.com';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async getQuote(symbol: string, assetClass: AssetClass): Promise<MarketQuote> {
        try {
            const response = await axios.get(`${this.baseUrl}/quote`, {
                params: { symbol, apikey: this.apiKey },
            });

            const d = response.data;
            if (d.status === 'error') throw new Error(d.message);

            return {
                symbol,
                price: parseFloat(d.close) || 0,
                change: parseFloat(d.change) || 0,
                changePercent: parseFloat(d.percent_change) || 0,
                high: parseFloat(d.high) || 0,
                low: parseFloat(d.low) || 0,
                open: parseFloat(d.open) || 0,
                previousClose: parseFloat(d.previous_close) || 0,
                timestamp: d.timestamp ? d.timestamp * 1000 : Date.now(),
                assetClass,
                provider: this.name,
            };
        } catch (error) {
            logger.error(`Twelve Data error for ${symbol}:`, error);
            throw error;
        }
    }

    async getHistory(symbol: string, assetClass: AssetClass, interval: string, limit: number): Promise<HistoricalBar[]> {
        try {
            const response = await axios.get(`${this.baseUrl}/time_series`, {
                params: { symbol, interval, outputsize: limit, apikey: this.apiKey },
            });

            const d = response.data;
            if (d.status === 'error') throw new Error(d.message);

            return d.values.map((v: any) => ({
                time: new Date(v.datetime).getTime(),
                open: parseFloat(v.open),
                high: parseFloat(v.high),
                low: parseFloat(v.low) || parseFloat(v.close), // some might not have low
                close: parseFloat(v.close),
                volume: parseInt(v.volume) || 0,
            })).reverse(); // Twelve Data returns newest first
        } catch (error) {
            logger.error(`Twelve Data history error for ${symbol}:`, error);
            throw error;
        }
    }
}
