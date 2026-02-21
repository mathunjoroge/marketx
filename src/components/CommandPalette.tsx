'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
    Search, BarChart3, PieChart, LineChart, Settings, Shield,
    Briefcase, Star, DollarSign, Brain, X, ArrowRight
} from 'lucide-react';

interface CommandItem {
    id: string;
    label: string;
    description: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    href: string;
    category: string;
}

const COMMANDS: CommandItem[] = [
    { id: 'dashboard', label: 'Dashboard', description: 'Home overview', icon: BarChart3, href: '/', category: 'Navigate' },
    { id: 'market', label: 'Markets', description: 'Live market data', icon: LineChart, href: '/market', category: 'Navigate' },
    { id: 'stocks', label: 'Stocks', description: 'Stock markets', icon: BarChart3, href: '/stocks', category: 'Navigate' },
    { id: 'crypto', label: 'Crypto', description: 'Cryptocurrency markets', icon: DollarSign, href: '/crypto', category: 'Navigate' },
    { id: 'forex', label: 'Forex', description: 'Foreign exchange', icon: DollarSign, href: '/forex', category: 'Navigate' },
    { id: 'portfolio', label: 'Portfolio', description: 'Holdings & trades', icon: Briefcase, href: '/portfolio', category: 'Navigate' },
    { id: 'watchlist', label: 'Watchlist', description: 'Tracked assets', icon: Star, href: '/watchlist', category: 'Navigate' },
    { id: 'analytics', label: 'Analytics', description: 'Performance metrics', icon: PieChart, href: '/analytics', category: 'Navigate' },
    { id: 'finance', label: 'Finance', description: 'Income, goals & health', icon: DollarSign, href: '/finance', category: 'Navigate' },
    { id: 'budgets', label: 'Budgets', description: 'Budget tracker', icon: DollarSign, href: '/budgets', category: 'Navigate' },
    { id: 'advisor', label: 'AI Advisor', description: 'AI financial advice', icon: Brain, href: '/advisor', category: 'Navigate' },
    { id: 'settings', label: 'Settings', description: 'Account & preferences', icon: Settings, href: '/settings', category: 'Settings' },
    { id: 'admin', label: 'Admin', description: 'Platform management', icon: Shield, href: '/admin', category: 'Settings' },
];

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const filtered = COMMANDS.filter(cmd =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description.toLowerCase().includes(query.toLowerCase())
    );

    const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
        if (!acc[cmd.category]) acc[cmd.category] = [];
        acc[cmd.category].push(cmd);
        return acc;
    }, {});

    const flatFiltered = Object.values(grouped).flat();

    const selectItem = useCallback((item: CommandItem) => {
        setIsOpen(false);
        setQuery('');
        router.push(item.href);
    }, [router]);

    // Global Cmd+K / Ctrl+K listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Keyboard navigation within palette
    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, flatFiltered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (flatFiltered[selectedIndex]) {
                selectItem(flatFiltered[selectedIndex]);
            }
        }
    };

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    if (!isOpen) return null;

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: '20vh',
            }}
            onClick={() => setIsOpen(false)}
        >
            {/* Backdrop */}
            <div style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
            }} />

            {/* Palette */}
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '560px',
                    margin: '0 1rem',
                    backgroundColor: '#161b22',
                    border: '1px solid rgba(55,65,81,0.6)',
                    borderRadius: '1rem',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                    animation: 'commandPaletteIn 0.15s ease-out',
                }}
            >
                {/* Search Input */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid rgba(55,65,81,0.4)',
                }}>
                    <Search size={20} style={{ color: '#6b7280', flexShrink: 0 }} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        placeholder="Search pages..."
                        aria-label="Search pages"
                        style={{
                            flex: 1,
                            backgroundColor: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: 'white',
                            fontSize: '1rem',
                        }}
                    />
                    <button
                        onClick={() => setIsOpen(false)}
                        aria-label="Close command palette"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.25rem',
                            backgroundColor: 'rgba(55,65,81,0.4)',
                            borderRadius: '0.375rem',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#9ca3af',
                        }}
                    >
                        <X size={14} />
                    </button>
                    <kbd style={{
                        fontSize: '0.625rem',
                        padding: '0.125rem 0.375rem',
                        backgroundColor: 'rgba(55,65,81,0.4)',
                        borderRadius: '0.25rem',
                        color: '#6b7280',
                        fontFamily: 'ui-monospace, monospace',
                        border: '1px solid rgba(55,65,81,0.6)',
                    }}>ESC</kbd>
                </div>

                {/* Results */}
                <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '0.5rem' }}>
                    {flatFiltered.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                            No results found
                        </div>
                    ) : (
                        Object.entries(grouped).map(([category, items]) => (
                            <div key={category}>
                                <div style={{
                                    padding: '0.5rem 0.75rem',
                                    fontSize: '0.625rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase' as const,
                                    letterSpacing: '0.05em',
                                    color: '#6b7280',
                                }}>
                                    {category}
                                </div>
                                {items.map(item => {
                                    const globalIndex = flatFiltered.indexOf(item);
                                    const isActive = globalIndex === selectedIndex;
                                    const IconComp = item.icon;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => selectItem(item)}
                                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '0.625rem 0.75rem',
                                                borderRadius: '0.5rem',
                                                border: 'none',
                                                cursor: 'pointer',
                                                backgroundColor: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
                                                color: 'white',
                                                textAlign: 'left',
                                                fontSize: '0.875rem',
                                                transition: 'background-color 0.1s',
                                            }}
                                        >
                                            <div style={{
                                                width: '2rem',
                                                height: '2rem',
                                                borderRadius: '0.5rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: isActive ? 'rgba(59,130,246,0.15)' : 'rgba(55,65,81,0.3)',
                                                color: isActive ? '#60a5fa' : '#9ca3af',
                                                flexShrink: 0,
                                            }}>
                                                <IconComp size={16} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500 }}>{item.label}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{item.description}</div>
                                            </div>
                                            {isActive && <ArrowRight size={14} style={{ color: '#60a5fa' }} />}
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '0.625rem 1.25rem',
                    borderTop: '1px solid rgba(55,65,81,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    fontSize: '0.6875rem',
                    color: '#6b7280',
                }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <kbd style={{ padding: '0.125rem 0.25rem', backgroundColor: 'rgba(55,65,81,0.4)', borderRadius: '0.25rem', fontFamily: 'ui-monospace, monospace', fontSize: '0.625rem', border: '1px solid rgba(55,65,81,0.6)' }}>↑↓</kbd>
                        Navigate
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <kbd style={{ padding: '0.125rem 0.25rem', backgroundColor: 'rgba(55,65,81,0.4)', borderRadius: '0.25rem', fontFamily: 'ui-monospace, monospace', fontSize: '0.625rem', border: '1px solid rgba(55,65,81,0.6)' }}>↵</kbd>
                        Open
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <kbd style={{ padding: '0.125rem 0.25rem', backgroundColor: 'rgba(55,65,81,0.4)', borderRadius: '0.25rem', fontFamily: 'ui-monospace, monospace', fontSize: '0.625rem', border: '1px solid rgba(55,65,81,0.6)' }}>⌘K</kbd>
                        Toggle
                    </span>
                </div>
            </div>

            <style>{`
                @keyframes commandPaletteIn {
                    from { opacity: 0; transform: scale(0.96) translateY(-10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>,
        document.body
    );
}
