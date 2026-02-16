import { formatSymbolForCountry } from '@/lib/exchanges';
import { COUNTRIES } from '@/lib/countries';

describe('Exchange and Country Logic', () => {
    it('should prioritize exchanges correctly', () => {
        expect(formatSymbolForCountry('AAPL', 'US')).toBe('AAPL');
        expect(formatSymbolForCountry('VOD', 'GB')).toBe('VOD.L');
        expect(formatSymbolForCountry('SAP', 'DE')).toBe('SAP.DE');
    });

    it('should have a large list of countries', () => {
        expect(COUNTRIES.length).toBeGreaterThan(50);
    });

    it('should mark some countries as supported', () => {
        const supported = COUNTRIES.filter(c => c.supported);
        expect(supported.length).toBeGreaterThan(10);
    });
});
