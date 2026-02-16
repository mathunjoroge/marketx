'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface Watchlist {
    id: string;
    name: string;
    symbols: string[];
    createdAt: string;
    updatedAt: string;
}

export function useWatchlist() {
    const { status } = useSession();
    const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWatchlists = useCallback(async () => {
        // Only fetch if authenticated
        if (status !== 'authenticated') {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/watchlist');
            if (!res.ok) throw new Error('Failed to fetch watchlists');
            const data = await res.json();
            setWatchlists(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load watchlists');
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        fetchWatchlists();
    }, [fetchWatchlists]);

    const createWatchlist = async (name: string, symbols: string[] = []) => {
        try {
            const res = await fetch('/api/watchlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, symbols }),
            });
            if (!res.ok) throw new Error('Failed to create watchlist');
            const newWatchlist = await res.json();
            setWatchlists(prev => [newWatchlist, ...prev]);
            return newWatchlist;
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const addToWatchlist = async (watchlistId: string, symbol: string) => {
        try {
            const watchlist = watchlists.find(w => w.id === watchlistId);
            if (!watchlist) throw new Error('Watchlist not found');

            if (watchlist.symbols.includes(symbol)) return; // Already exists

            const newSymbols = [...watchlist.symbols, symbol];

            // Optimistic update
            setWatchlists(prev => prev.map(w =>
                w.id === watchlistId ? { ...w, symbols: newSymbols } : w
            ));

            const res = await fetch(`/api/watchlist/${watchlistId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbols: newSymbols }),
            });

            if (!res.ok) {
                // Revert on error
                setWatchlists(prev => prev.map(w =>
                    w.id === watchlistId ? watchlist : w
                ));
                throw new Error('Failed to update watchlist');
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const removeFromWatchlist = async (watchlistId: string, symbol: string) => {
        try {
            const watchlist = watchlists.find(w => w.id === watchlistId);
            if (!watchlist) throw new Error('Watchlist not found');

            const newSymbols = watchlist.symbols.filter(s => s !== symbol);

            // Optimistic update
            setWatchlists(prev => prev.map(w =>
                w.id === watchlistId ? { ...w, symbols: newSymbols } : w
            ));

            const res = await fetch(`/api/watchlist/${watchlistId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbols: newSymbols }),
            });

            if (!res.ok) {
                // Revert
                setWatchlists(prev => prev.map(w =>
                    w.id === watchlistId ? watchlist : w
                ));
                throw new Error('Failed to update watchlist');
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const isInWatchlist = (symbol: string, watchlistId?: string) => {
        if (watchlistId) {
            const w = watchlists.find(w => w.id === watchlistId);
            return w?.symbols.includes(symbol) || false;
        }
        // Check if in ANY watchlist (usually default one)
        // For simplicity, we might just check the first one or a "Default" one.
        // Let's check ALL for now, returning true if in any.
        return watchlists.some(w => w.symbols.includes(symbol));
    };

    // Helper to get the default watchlist (creating it if needed is complex here, 
    // better done in UI or a dedicated method, but let's provide a getter)
    const getDefaultWatchlist = () => {
        // Assuming the first one is default or one named "Default"
        return watchlists.find(w => w.name === 'Default') || watchlists[0];
    };

    const renameWatchlist = async (watchlistId: string, newName: string) => {
        try {
            const watchlist = watchlists.find(w => w.id === watchlistId);
            if (!watchlist) throw new Error('Watchlist not found');

            // Optimistic update
            setWatchlists(prev => prev.map(w =>
                w.id === watchlistId ? { ...w, name: newName } : w
            ));

            const res = await fetch(`/api/watchlist/${watchlistId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName }),
            });

            if (!res.ok) {
                // Revert
                setWatchlists(prev => prev.map(w =>
                    w.id === watchlistId ? watchlist : w
                ));
                throw new Error('Failed to rename watchlist');
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const deleteWatchlist = async (watchlistId: string) => {
        try {
            const watchlist = watchlists.find(w => w.id === watchlistId);
            if (!watchlist) throw new Error('Watchlist not found');

            // Optimistic update
            setWatchlists(prev => prev.filter(w => w.id !== watchlistId));

            const res = await fetch(`/api/watchlist/${watchlistId}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                // Revert
                setWatchlists(prev => [...prev, watchlist]);
                throw new Error('Failed to delete watchlist');
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const [activeWatchlistId, setActiveWatchlistId] = useState<string | null>(null);

    // Set default active watchlist when loaded
    useEffect(() => {
        if (watchlists.length > 0 && !activeWatchlistId) {
            setActiveWatchlistId(watchlists[0].id);
        }
    }, [watchlists, activeWatchlistId]);

    const activeWatchlist = watchlists.find(w => w.id === activeWatchlistId) || watchlists[0] || null;

    const setActiveWatchlist = (watchlist: Watchlist) => setActiveWatchlistId(watchlist.id);

    return {
        watchlists,
        activeWatchlist,
        setActiveWatchlist,
        loading,
        error,
        fetchWatchlists,
        createWatchlist,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        getDefaultWatchlist,
        renameWatchlist,
        deleteWatchlist,
    };
}
