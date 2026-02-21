'use client';

import AssetCard from '@/components/AssetCard';
import { useMarket } from '@/context/MarketContext';
import { getFeaturedAssets } from '@/lib/offers';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function StocksPage() {
    const { country } = useMarket();
    const stocks = getFeaturedAssets(country).filter(a => a.assetClass === 'stock');

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Stock Markets ({country})</h1>
            <ErrorBoundary>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stocks.length > 0 ? stocks.map(item => (
                        <AssetCard key={item.symbol} {...item} />
                    )) : <div className="col-span-full p-8 text-center text-gray-500">No stocks featured for this region.</div>}
                </div>
            </ErrorBoundary>
        </div>
    );
}
