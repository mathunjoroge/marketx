'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWatchlist } from '@/hooks/useWatchlist';
import AssetCard from '@/components/AssetCard';
import { Asset } from '@/lib/types';
import { Plus, Edit2, Trash2, Check, X, TrendingUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import AuthGuard from '@/components/auth/AuthGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Constants
const REFRESH_INTERVAL = 30000; // 30 seconds
const ASSET_CLASS = 'stock' as const;

// Types
interface AssetsState {
    data: Record<string, Asset>;
    loading: boolean;
    error: string | null;
}

// Components
const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-[50vh]">
        <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        </div>
    </div>
);

const ErrorDisplay = ({ error }: { error: string }) => (
    <div className="max-w-2xl mx-auto mt-16 p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center">
        <p className="text-lg font-medium">Error loading watchlists</p>
        <p className="text-sm mt-2">{error}</p>
    </div>
);

const EmptyState = ({
    icon: Icon,
    title,
    description,
    action
}: {
    icon: React.ElementType;
    title: string;
    description: React.ReactNode;
    action?: React.ReactNode;
}) => (
    <div className="bg-[#0d1117]/50 border border-gray-800 rounded-xl p-12 text-center">
        <div className="inline-flex p-4 bg-gray-800/20 rounded-full border border-gray-700/30 mb-4">
            <Icon className="w-12 h-12 text-gray-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <div className="text-gray-400 max-w-sm mx-auto">{description}</div>
        {action && <div className="mt-6">{action}</div>}
    </div>
);

const AssetSkeleton = () => (
    <div className="h-40 bg-[#161b22] border border-gray-800 rounded-xl p-6 animate-pulse">
        <div className="flex justify-between items-start">
            <div className="h-6 w-20 bg-gray-700 rounded" />
            <div className="h-8 w-8 bg-gray-700 rounded-lg" />
        </div>
        <div className="mt-4 space-y-2">
            <div className="h-8 w-32 bg-gray-700 rounded" />
            <div className="h-4 w-24 bg-gray-800 rounded" />
        </div>
    </div>
);

export default function WatchlistPage() {
    const { watchlists, loading, error, createWatchlist, renameWatchlist, deleteWatchlist } = useWatchlist();

    // State
    const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | null>(null);
    const [assets, setAssets] = useState<AssetsState>({
        data: {},
        loading: false,
        error: null
    });
    const [isCreating, setIsCreating] = useState(false);
    const [newListName, setNewListName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Memoized values
    const activeWatchlist = useMemo(
        () => watchlists.find(w => w.id === selectedWatchlistId),
        [watchlists, selectedWatchlistId]
    );

    // Auto-select first watchlist
    useEffect(() => {
        if (watchlists.length > 0 && !selectedWatchlistId) {
            setSelectedWatchlistId(watchlists[0].id);
        }
    }, [watchlists, selectedWatchlistId]);

    // Fetch asset prices
    const fetchAssetPrices = useCallback(async (symbols: string[]) => {
        if (!symbols.length) return;

        setAssets(prev => ({ ...prev, loading: true, error: null }));

        try {
            const newAssets: Record<string, Asset> = {};

            await Promise.all(
                symbols.map(async (symbol) => {
                    try {
                        const response = await fetch(`/api/market-data?symbol=${encodeURIComponent(symbol)}`);
                        if (!response.ok) return;

                        const data = await response.json();
                        if (data.symbol) {
                            newAssets[symbol] = {
                                symbol: data.symbol,
                                name: data.name || data.symbol,
                                price: data.price ?? 0,
                                change: data.change ?? 0,
                                changePercent: data.changePercent ?? 0,
                                assetClass: data.assetClass || ASSET_CLASS,
                            };
                        }
                    } catch (error) {
                        console.error(`Failed to fetch ${symbol}:`, error);
                    }
                })
            );

            setAssets({ data: newAssets, loading: false, error: null });
        } catch (error) {
            setAssets(prev => ({
                ...prev,
                loading: false,
                error: 'Failed to fetch asset prices'
            }));
        }
    }, []);

    // Initial fetch and refresh interval
    useEffect(() => {
        if (!activeWatchlist?.symbols.length) {
            setAssets({ data: {}, loading: false, error: null });
            return;
        }

        fetchAssetPrices(activeWatchlist.symbols);

        const intervalId = setInterval(
            () => fetchAssetPrices(activeWatchlist.symbols),
            REFRESH_INTERVAL
        );

        return () => clearInterval(intervalId);
    }, [activeWatchlist, fetchAssetPrices]);

    // Handlers
    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName.trim()) return;

        setIsCreating(true);
        try {
            const newList = await createWatchlist(newListName.trim());
            setNewListName('');
            setSelectedWatchlistId(newList.id);
        } catch (error) {
            console.error('Failed to create watchlist:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleStartRename = (watchlistId: string, currentName: string) => {
        setEditingId(watchlistId);
        setEditingName(currentName);
    };

    const handleSaveRename = async (watchlistId: string) => {
        const trimmedName = editingName.trim();
        const originalName = watchlists.find(w => w.id === watchlistId)?.name;

        if (!trimmedName || trimmedName === originalName) {
            setEditingId(null);
            return;
        }

        try {
            await renameWatchlist(watchlistId, trimmedName);
            setEditingId(null);
        } catch (error) {
            console.error('Failed to rename watchlist:', error);
        }
    };

    const handleDelete = async (watchlistId: string) => {
        try {
            await deleteWatchlist(watchlistId);
            setDeletingId(null);
            if (selectedWatchlistId === watchlistId) {
                setSelectedWatchlistId(watchlists[0]?.id ?? null);
            }
        } catch (error) {
            console.error('Failed to delete watchlist:', error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, action: () => void, cancel: () => void) => {
        if (e.key === 'Enter') action();
        if (e.key === 'Escape') cancel();
    };

    // Loading and error states
    if (loading && !watchlists.length) return <LoadingSpinner />;
    if (error) return <ErrorDisplay error={error} />;

    return (
        <AuthGuard>
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <header className="mb-8">
                    <div className="bg-gradient-to-r from-[#0d1117]/80 to-transparent p-6 rounded-xl border-l-4 border-indigo-500 backdrop-blur-sm">
                        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                            My Watchlists
                        </h1>
                    </div>
                </header>

                {/* Watchlist Tabs */}
                <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    {watchlists.map((watchlist) => {
                        const isActive = selectedWatchlistId === watchlist.id;
                        const isEditing = editingId === watchlist.id;

                        return (
                            <div
                                key={watchlist.id}
                                className={`
                flex items-center gap-2 px-4 py-2 rounded-full transition-all
                ${isActive
                                        ? 'bg-indigo-600/90 border border-indigo-400 shadow-lg shadow-indigo-600/40 text-white'
                                        : 'bg-gray-800/80 border border-gray-600 text-gray-200 hover:bg-gray-700'
                                    }
              `}
                            >
                                {isEditing ? (
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="text"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(
                                                e,
                                                () => handleSaveRename(watchlist.id),
                                                () => setEditingId(null)
                                            )}
                                            className="px-2 py-1 bg-gray-900 border border-gray-600 rounded text-sm min-w-[120px] text-white focus:outline-none focus:border-indigo-500"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleSaveRename(watchlist.id)}
                                            className="p-1 hover:bg-green-600/20 rounded-full transition-colors"
                                            aria-label="Save rename"
                                        >
                                            <Check size={16} className="text-green-400" />
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="p-1 hover:bg-red-600/20 rounded-full transition-colors"
                                            aria-label="Cancel rename"
                                        >
                                            <X size={16} className="text-red-400" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => setSelectedWatchlistId(watchlist.id)}
                                            className="font-medium text-sm whitespace-nowrap"
                                        >
                                            {watchlist.name}
                                            <span className="ml-1 text-xs opacity-75">
                                                ({watchlist.symbols.length})
                                            </span>
                                        </button>
                                        <div className="flex gap-1 pl-2 border-l border-white/20">
                                            <button
                                                onClick={() => handleStartRename(watchlist.id, watchlist.name)}
                                                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                                                aria-label="Rename watchlist"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                            <button
                                                onClick={() => setDeletingId(watchlist.id)}
                                                className="p-1 hover:bg-red-500/20 rounded-full transition-colors"
                                                aria-label="Delete watchlist"
                                            >
                                                <Trash2 size={12} className="text-red-400" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}

                    {/* Create New Watchlist */}
                    {isCreating ? (
                        <form onSubmit={handleCreateList} className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-full px-2 py-1">
                            <input
                                type="text"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                placeholder="List name"
                                className="px-2 py-1 bg-transparent text-sm min-w-[120px] text-white focus:outline-none"
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="p-1 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white transition-colors"
                                aria-label="Create watchlist"
                            >
                                <Check size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreating(false);
                                    setNewListName('');
                                }}
                                className="p-1 hover:bg-gray-700 rounded-full text-gray-400 transition-colors"
                                aria-label="Cancel creation"
                            >
                                <X size={14} />
                            </button>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/30 border border-dashed border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-white hover:border-gray-500 transition-all text-sm"
                        >
                            <Plus size={16} />
                            <span className="font-medium">New List</span>
                        </button>
                    )}
                </div>

                {/* Delete Confirmation Modal */}
                {deletingId && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-[#0d1117] border border-gray-700 rounded-xl max-w-md w-full p-6 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-2">Delete Watchlist?</h3>
                            <p className="text-gray-400 mb-6">
                                Are you sure you want to delete{' '}
                                <span className="font-semibold text-white">
                                    "{watchlists.find(w => w.id === deletingId)?.name}"
                                </span>
                                ? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleDelete(deletingId)}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => setDeletingId(null)}
                                    className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium border border-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Watchlist Content */}
                <ErrorBoundary>
                    {!activeWatchlist ? (
                        <EmptyState
                            icon={Plus}
                            title="Start Your Watchlist Journey"
                            description="Create your first watchlist to track market movements."
                        />
                    ) : activeWatchlist.symbols.length === 0 ? (
                        <EmptyState
                            icon={TrendingUp}
                            title="Watchlist is Empty"
                            description={
                                <>
                                    Head over to the{' '}
                                    <Link href="/market" className="text-indigo-400 hover:text-indigo-300 font-medium">
                                        Market page
                                    </Link>{' '}
                                    to discover and add assets to{' '}
                                    <span className="text-indigo-400 font-medium">"{activeWatchlist.name}"</span>.
                                </>
                            }
                            action={
                                <Link
                                    href="/market"
                                    className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-900/30"
                                >
                                    Explore Markets
                                </Link>
                            }
                        />
                    ) : (
                        <>
                            {/* Refresh indicator */}
                            {assets.loading && (
                                <div className="flex items-center justify-end gap-2 mb-4 text-sm text-gray-400">
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Updating prices...</span>
                                </div>
                            )}

                            {/* Assets grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activeWatchlist.symbols.map(symbol =>
                                    assets.data[symbol] ? (
                                        <AssetCard key={symbol} {...assets.data[symbol]} />
                                    ) : (
                                        <AssetSkeleton key={symbol} />
                                    )
                                )}
                            </div>

                            {/* Error message */}
                            {assets.error && (
                                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                    {assets.error}
                                </div>
                            )}
                        </>
                    )}
                </ErrorBoundary>
            </div>
        </AuthGuard>
    );
}