'use client';

import { X, Check, Loader, Plus, Star } from 'lucide-react';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface WatchlistSelectModalProps {
    symbol: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function WatchlistSelectModal({
    symbol,
    isOpen,
    onClose
}: WatchlistSelectModalProps) {
    const { watchlists, addToWatchlist, removeFromWatchlist, createWatchlist, loading } = useWatchlist();
    const [newListName, setNewListName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    const handleToggleList = async (watchlistId: string) => {
        const watchlist = watchlists.find((w: any) => w.id === watchlistId);
        if (!watchlist) return;

        try {
            if (watchlist.symbols.includes(symbol)) {
                await removeFromWatchlist(watchlistId, symbol);
            } else {
                await addToWatchlist(watchlistId, symbol);
            }
        } catch (error) {
            console.error('Toggle failed:', error);
        }
    };

    const handleCreateList = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName.trim()) return;

        setIsCreating(true);
        try {
            await createWatchlist(newListName.trim(), [symbol]);
            setNewListName('');
            onClose();
        } catch (error) {
            console.error('Create failed:', error);
        } finally {
            setIsCreating(false);
        }
    };

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(3px)',
                    zIndex: 9998
                }}
            />

            {/* Modal Container */}
            <div
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '420px',
                    backgroundColor: '#1f2937',
                    borderRadius: '12px',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'fadeIn 0.2s ease'
                }}
            >

                {/* Header */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #2d3748',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Star size={18} color="#3b82f6" />
                        <div>
                            <div style={{ fontWeight: 600, color: '#ffffff' }}>
                                Add to Watchlist
                            </div>
                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                {symbol}
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#9ca3af'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div style={{
                    padding: '16px 20px',
                    maxHeight: '250px',
                    overflowY: 'auto'
                }}>
                    {watchlists.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            color: '#9ca3af',
                            padding: '20px 0'
                        }}>
                            No watchlists yet.
                        </div>
                    ) : (
                        watchlists.map((watchlist: any) => {
                            const isInList = watchlist.symbols.includes(symbol);

                            return (
                                <div
                                    key={watchlist.id}
                                    onClick={() => handleToggleList(watchlist.id)}
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        marginBottom: '8px',
                                        backgroundColor: isInList ? '#1e40af' : '#374151',
                                        color: '#ffffff',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        transition: '0.2s'
                                    }}
                                >
                                    <span>{watchlist.name}</span>
                                    {isInList && <Check size={16} />}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer / Create */}
                <form
                    onSubmit={handleCreateList}
                    style={{
                        padding: '16px 20px',
                        borderTop: '1px solid #2d3748',
                        display: 'flex',
                        gap: '8px'
                    }}
                >
                    <input
                        type="text"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="New watchlist name..."
                        disabled={isCreating}
                        style={{
                            flex: 1,
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid #4b5563',
                            backgroundColor: '#111827',
                            color: '#ffffff',
                            fontSize: '14px'
                        }}
                    />

                    <button
                        type="submit"
                        disabled={isCreating || !newListName.trim()}
                        style={{
                            padding: '8px 14px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: '#0d6efd',
                            color: '#ffffff',
                            fontWeight: 600,
                            cursor: isCreating || !newListName.trim() ? 'not-allowed' : 'pointer',
                            opacity: isCreating || !newListName.trim() ? 0.6 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        {isCreating ? (
                            <Loader size={14} />
                        ) : (
                            <>
                                <Plus size={14} />
                                Create
                            </>
                        )}
                    </button>
                </form>
            </div>
        </>,
        document.body
    );
}
