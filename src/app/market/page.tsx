'use client';

import { useState, useEffect } from 'react';
import { useMarket } from '@/context/MarketContext';
import { getFeaturedAssets, FeaturedAsset } from '@/lib/offers';
import AssetCard from '@/components/AssetCard';
import SearchBox from '@/components/SearchBox';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';

export default function MarketPage() {
    const { country } = useMarket();
    const [filteredAssets, setFilteredAssets] = useState<FeaturedAsset[]>([]);

    useEffect(() => {
        setFilteredAssets(getFeaturedAssets(country));
    }, [country]);

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                        Market Overview
                    </h1>
                    <p className="text-gray-400 mt-2">Global markets at a glance</p>
                </div>
                <div className="w-full md:w-auto">
                    <SearchBox onSearch={setFilteredAssets} />
                </div>
            </div>

            {/* Content based on filtered results */}
            {filteredAssets.length > 0 ? (
                <>
                    {/* Crypto Section */}
                    {filteredAssets.some(a => a.assetClass === 'crypto') && (
                        <section>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Cryptocurrencies</h2>
                                <Link href="/crypto" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                                    View All Crypto &rarr;
                                </Link>
                            </div>
                            <ErrorBoundary>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredAssets.filter(a => a.assetClass === 'crypto').map(item => (
                                        <AssetCard key={item.symbol} {...item} />
                                    ))}
                                </div>
                            </ErrorBoundary>
                        </section>
                    )}

                    {/* Forex Section */}
                    {filteredAssets.some(a => a.assetClass === 'forex') && (
                        <section>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Forex</h2>
                                <Link href="/forex" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                                    View All Forex &rarr;
                                </Link>
                            </div>
                            <ErrorBoundary>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredAssets.filter(a => a.assetClass === 'forex').map(item => (
                                        <AssetCard key={item.symbol} {...item} />
                                    ))}
                                </div>
                            </ErrorBoundary>
                        </section>
                    )}

                    {/* Stocks Section */}
                    {filteredAssets.some(a => a.assetClass === 'stock') && (
                        <section>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Global Stocks</h2>
                                <Link href="/stocks" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                                    View All Stocks &rarr;
                                </Link>
                            </div>
                            <ErrorBoundary>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredAssets.filter(a => a.assetClass === 'stock').map(item => (
                                        <AssetCard key={item.symbol} {...item} />
                                    ))}
                                </div>
                            </ErrorBoundary>
                        </section>
                    )}
                </>
            ) : (
                <div className="text-center py-20 text-gray-500">
                    No assets found. Try a different search term.
                </div>
            )}
        </div>
    );
}
