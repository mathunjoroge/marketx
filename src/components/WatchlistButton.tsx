'use client';

import { Star } from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useState } from 'react';
import WatchlistSelectModal from './WatchlistSelectModal';

interface WatchlistButtonProps {
    symbol: string;
    className?: string;
}

export default function WatchlistButton({ symbol, className = '' }: WatchlistButtonProps) {
    const { watchlists, loading } = useWatchlist();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Calculate state during render to avoid useEffect
    const listsContainingSymbol = watchlists.filter(w => w.symbols.includes(symbol));
    const isWatched = listsContainingSymbol.length > 0;
    const watchlistCount = listsContainingSymbol.length;

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsModalOpen(true);
    };

    return (
        <>
            <button
                onClick={handleClick}
                disabled={loading}
                className={`
                    relative flex items-center justify-center
                    w-10 h-10 rounded-xl transition-all duration-200
                    bg-gray-800/80 backdrop-blur-sm border border-gray-700/50
                    hover:bg-gray-600 hover:border-gray-500 hover:scale-110 active:scale-95 cursor-pointer
                    shadow-lg shadow-black/20
                    group/btn z-40
                    ${className}
                `}
                title={isWatched ? `In ${watchlistCount} watchlist${watchlistCount > 1 ? 's' : ''}` : "Add to watchlist"}
            >
                <Star
                    size={18}
                    className={`transition-all duration-300 ${isWatched
                        ? 'fill-yellow-400 text-yellow-400 scale-110 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                        : 'text-gray-400 group-hover/btn:text-yellow-400 group-hover/btn:scale-110'
                        }`}
                />
                {watchlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 border border-[#0d1117] shadow-sm">
                        {watchlistCount}
                    </span>
                )}
            </button>

            <WatchlistSelectModal
                symbol={symbol}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
