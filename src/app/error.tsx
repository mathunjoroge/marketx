'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[128px] pointer-events-none" />

            <div className="text-center relative z-10 max-w-lg">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 mb-6">
                    <AlertTriangle className="w-10 h-10 text-red-400" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-3">
                    Something Went Wrong
                </h1>
                <p className="text-gray-400 mb-2 leading-relaxed">
                    An unexpected error occurred. This has been logged and we&apos;ll look into it.
                </p>
                {error.digest && (
                    <p className="text-xs text-gray-600 font-mono mb-8">
                        Error ID: {error.digest}
                    </p>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        onClick={reset}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-6 py-3 bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 hover:text-white font-medium rounded-xl border border-gray-700/50 transition-all"
                    >
                        <Home className="w-4 h-4" />
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
