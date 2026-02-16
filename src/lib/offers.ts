export interface FeaturedAsset {
    symbol: string;
    name: string;
    assetClass: 'stock' | 'crypto' | 'forex';
}

const GLOBAL_STOCKS: FeaturedAsset[] = [
    { symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'stock' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', assetClass: 'stock' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', assetClass: 'stock' },
    { symbol: 'TSLA', name: 'Tesla Inc.', assetClass: 'stock' },
    { symbol: 'NVDA', name: 'Nvidia', assetClass: 'stock' },
    { symbol: 'AMZN', name: 'Amazon', assetClass: 'stock' },
    { symbol: 'META', name: 'Meta Platforms', assetClass: 'stock' },
    { symbol: 'NFLX', name: 'Netflix', assetClass: 'stock' },
    { symbol: 'DIS', name: 'Walt Disney', assetClass: 'stock' },
    { symbol: 'PYPL', name: 'PayPal', assetClass: 'stock' },
];

const GLOBAL_CRYPTO: FeaturedAsset[] = [
    { symbol: 'BTC/USD', name: 'Bitcoin', assetClass: 'crypto' },
    { symbol: 'ETH/USD', name: 'Ethereum', assetClass: 'crypto' },
    { symbol: 'SOL/USD', name: 'Solana', assetClass: 'crypto' },
    { symbol: 'XRP/USD', name: 'Ripple', assetClass: 'crypto' },
    { symbol: 'ADA/USD', name: 'Cardano', assetClass: 'crypto' },
    { symbol: 'DOGE/USD', name: 'Dogecoin', assetClass: 'crypto' },
];

const GLOBAL_FOREX: FeaturedAsset[] = [
    { symbol: 'EUR/USD', name: 'Euro / US Dollar', assetClass: 'forex' },
    { symbol: 'GBP/USD', name: 'British Pound', assetClass: 'forex' },
    { symbol: 'USD/JPY', name: 'US Dollar / Yen', assetClass: 'forex' },
    { symbol: 'AUD/USD', name: 'Australian Dollar', assetClass: 'forex' },
    { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', assetClass: 'forex' },
    { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', assetClass: 'forex' },
];

export const REGIONAL_OFFERS: Record<string, FeaturedAsset[]> = {
    'US': [
        { symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'stock' },
        { symbol: 'NVDA', name: 'Nvidia', assetClass: 'stock' },
        { symbol: 'AMZN', name: 'Amazon', assetClass: 'stock' },
    ],
    'GB': [
        { symbol: 'VOD', name: 'Vodafone Group', assetClass: 'stock' },
        { symbol: 'HSBA', name: 'HSBC Holdings', assetClass: 'stock' },
        { symbol: 'BP', name: 'BP PLC', assetClass: 'stock' },
        { symbol: 'GBP/USD', name: 'British Pound', assetClass: 'forex' },
    ],
    'DE': [
        { symbol: 'SAP', name: 'SAP SE', assetClass: 'stock' },
        { symbol: 'DBK', name: 'Deutsche Bank', assetClass: 'stock' },
        { symbol: 'BMW', name: 'BMW Group', assetClass: 'stock' },
        { symbol: 'EUR/USD', name: 'Euro', assetClass: 'forex' },
    ],
    'IN': [
        { symbol: 'RELIANCE', name: 'Reliance Industries', assetClass: 'stock' },
        { symbol: 'TCS', name: 'Tata Consultancy', assetClass: 'stock' },
        { symbol: 'HDFCBANK', name: 'HDFC Bank', assetClass: 'stock' },
    ],
    'CN': [
        { symbol: 'BABA', name: 'Alibaba Group', assetClass: 'stock' },
        { symbol: 'TCEHY', name: 'Tencent Holdings', assetClass: 'stock' },
        { symbol: 'JD', name: 'JD.com', assetClass: 'stock' },
    ],
    'JP': [
        { symbol: '7203', name: 'Toyota Motor', assetClass: 'stock' },
        { symbol: '6758', name: 'Sony Group', assetClass: 'stock' },
        { symbol: '9984', name: 'SoftBank Group', assetClass: 'stock' },
        { symbol: 'USD/JPY', name: 'US Dollar / Yen', assetClass: 'forex' },
    ],
    'FR': [
        { symbol: 'MC', name: 'LVMH', assetClass: 'stock' },
        { symbol: 'OR', name: 'L\'oreal', assetClass: 'stock' },
        { symbol: 'TTE', name: 'TotalEnergies', assetClass: 'stock' },
    ],
    'BR': [
        { symbol: 'VALE', name: 'Vale SA', assetClass: 'stock' },
        { symbol: 'PBR', name: 'Petrobras', assetClass: 'stock' },
        { symbol: 'ITUB', name: 'Itau Unibanco', assetClass: 'stock' },
    ],
    'AU': [
        { symbol: 'CBA', name: 'Commonwealth Bank', assetClass: 'stock' },
        { symbol: 'BHP', name: 'BHP Group', assetClass: 'stock' },
        { symbol: 'AUD/USD', name: 'Australian Dollar', assetClass: 'forex' },
    ],
};

function getStringHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export function getFeaturedAssets(countryCode: string): FeaturedAsset[] {
    const regional = REGIONAL_OFFERS[countryCode] || [];
    const hash = getStringHash(countryCode);

    const combined = [...regional];
    const seenSymbols = new Set(regional.map(a => a.symbol));

    const addFromList = (list: FeaturedAsset[], count: number) => {
        const available = list.filter(a => !seenSymbols.has(a.symbol));
        // Use the hash to pick a starting index
        const startIdx = hash % Math.max(1, available.length);
        for (let i = 0; i < count && i < available.length; i++) {
            const asset = available[(startIdx + i) % available.length];
            if (asset) {
                combined.push(asset);
                seenSymbols.add(asset.symbol);
            }
        }
    };

    // Helper to ensure we get exactly target count
    const ensureCount = (categoryAssets: FeaturedAsset[], globalSource: FeaturedAsset[], target: number) => {
        const currentCount = combined.filter(a => a.assetClass === categoryAssets[0]?.assetClass).length;
        const needed = target - currentCount;

        if (needed > 0) {
            addFromList(globalSource, needed);
        }
    };

    // First ensure we have the regional ones added (already done via [...regional])

    // Now fill up to 6 for each category
    // Note: We need to filter combined to check current counts because regional might have mixed types

    const currentStocks = combined.filter(a => a.assetClass === 'stock').length;
    addFromList(GLOBAL_STOCKS, 6 - currentStocks);

    const currentCrypto = combined.filter(a => a.assetClass === 'crypto').length;
    addFromList(GLOBAL_CRYPTO, 6 - currentCrypto);

    const currentForex = combined.filter(a => a.assetClass === 'forex').length;
    addFromList(GLOBAL_FOREX, 6 - currentForex);

    return combined;
}
