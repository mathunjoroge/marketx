'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Search, TrendingUp } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[128px] pointer-events-none" />

            <div className="text-center relative z-10 max-w-lg">
                {/* 404 Badge */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 mb-6">
                    <span className="text-3xl font-black text-red-400">404</span>
                </div>

                <h1 className="text-3xl font-bold text-white mb-3">
                    Page Not Found
                </h1>
                <p className="text-gray-400 mb-8 leading-relaxed">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                    This might be a broken link or a mistyped URL.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
                    >
                        <Home className="w-4 h-4" />
                        Go to Dashboard
                    </Link>
                    <Link
                        href="/market"
                        className="flex items-center gap-2 px-6 py-3 bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 hover:text-white font-medium rounded-xl border border-gray-700/50 transition-all"
                    >
                        <TrendingUp className="w-4 h-4" />
                        Browse Markets
                    </Link>
                </div>

                {/* Quick links */}
                <div className="mt-12 pt-8 border-t border-gray-800/50">
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Quick Links</p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm">
                        {[
                            { name: 'Portfolio', path: '/portfolio' },
                            { name: 'Stocks', path: '/stocks' },
                            { name: 'Crypto', path: '/crypto' },
                            { name: 'Watchlist', path: '/watchlist' },
                        ].map((link) => (
                            <Link
                                key={link.path}
                                href={link.path}
                                className="text-gray-400 hover:text-blue-400 transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
