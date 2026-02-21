export const EXCHANGE_PRIORITY: Record<string, string[]> = {
    'US': ['NYSE', 'NASDAQ'],
    'GB': ['LSE'],
    'DE': ['XETRA', 'FRA'],
    'FR': ['Euronext Paris'],
    'JP': ['JPX'],
    'CA': ['TSX'],
    'IN': ['NSE', 'BSE'],
    // Add more mappings
};

export function getPriorityExchanges(countryCode: string): string[] {
    return EXCHANGE_PRIORITY[countryCode] || ['US']; // Default to US if unknown
}

export function formatSymbolForCountry(symbol: string, countryCode: string): string {
    // Logic to append exchange suffix if needed based on country priority
    if (countryCode === 'GB' && !symbol.includes('.')) {
        return `${symbol}.L`;
    }
    if (countryCode === 'DE' && !symbol.includes('.')) {
        return `${symbol}.DE`;
    }
    return symbol;
}
