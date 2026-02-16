export type AssetClass = 'stock' | 'forex' | 'crypto' | 'index' | 'commodity';

export interface MarketQuote {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    open: number;
    previousClose: number;
    timestamp: number;
    assetClass: AssetClass;
    provider: string;
}

export interface HistoricalBar {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface MarketDataProvider {
    name: string;
    getQuote(symbol: string, assetClass: AssetClass): Promise<MarketQuote>;
    getHistory(symbol: string, assetClass: AssetClass, interval: string, limit: number): Promise<HistoricalBar[]>;
}
