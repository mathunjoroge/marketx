'use client';

import { useMarket } from '@/context/MarketContext';
import { getFeaturedAssets } from '@/lib/offers';
import AssetCard from '@/components/AssetCard';
import PortfolioDashboard from '@/components/PortfolioDashboard';
import DashboardWatchlist from '@/components/DashboardWatchlist';
import Link from 'next/link';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import { ArrowRight, BarChart3, LineChart, PieChart } from 'lucide-react';

export default function DashboardPage() {
  const { country } = useMarket();
  const allAssets = getFeaturedAssets(country);

  const stocks = allAssets.filter(a => a.assetClass === 'stock').slice(0, 3);
  const crypto = allAssets.filter(a => a.assetClass === 'crypto').slice(0, 3);
  const forex = allAssets.filter(a => a.assetClass === 'forex').slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <AnnouncementBanner />
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome back to MarketX</p>
      </div>

      {/* Portfolio Summary Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-400" />
            Portfolio Summary
          </h2>
          <Link href="/portfolio" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
            View Details <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <PortfolioDashboard compact={true} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Watchlist & Quick Links */}
        <div className="space-y-8">
          <section className="h-[400px]">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <LineChart className="w-5 h-5 text-blue-400" />
              Watchlist
            </h2>
            <DashboardWatchlist />
          </section>

          <section className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl border border-gray-700/50 p-6 backdrop-blur-sm">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/market"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-blue-600 hover:bg-gray-100 rounded font-medium transition-colors border border-gray-200 active:scale-[0.98]"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Markets</span>
              </Link>

              <Link
                href="/analytics"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-blue-600 hover:bg-gray-100 rounded font-medium transition-colors border border-gray-200 active:scale-[0.98]"
              >
                <PieChart className="w-5 h-5" />
                <span>Analytics</span>
              </Link>
            </div>
          </section>
        </div>

        {/* Right Column: Market Overview */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-400" />
                Market Overview
              </h2>
              <Link href="/market" className="text-sm font-medium text-blue-500 hover:text-blue-400 hover:underline flex items-center gap-1">
                Full Market &rarr;
              </Link>
            </div>

            {/* Top Stocks */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Top Stocks</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stocks.map(item => (
                  <AssetCard key={item.symbol} {...item} />
                ))}
              </div>
            </div>

            {/* Top Crypto */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Top Crypto</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {crypto.map(item => (
                  <AssetCard key={item.symbol} {...item} />
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
