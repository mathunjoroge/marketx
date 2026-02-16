'use client';

import MarketChart from '@/components/MarketChart';
import { useMarket } from '@/context/MarketContext';
import { getFeaturedAssets } from '@/lib/offers';

export default function StocksPage() {
    const { country } = useMarket();
    const stocks = getFeaturedAssets(country).filter(a => a.assetClass === 'stock');

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Stock Markets ({country})</h1>
            <div className="grid">
                {stocks.length > 0 ? stocks.map(item => (
                    <div key={item.symbol} className="card">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">{item.name}</h2>
                                <p className="text-sm text-gray-400">{item.symbol}</p>
                            </div>
                        </div>
                        <MarketChart symbol={item.symbol} assetClass={item.assetClass} />
                    </div>
                )) : <div className="p-8 text-center text-gray-500">No stocks featured for this region.</div>}
            </div>
        </div>
    );
}
