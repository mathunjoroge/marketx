'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useMarket } from '@/context/MarketContext';
import { getFeaturedAssets, FeaturedAsset } from '@/lib/offers';

interface SearchBoxProps {
    onSearch: (results: FeaturedAsset[]) => void;
}

export default function SearchBox({ onSearch }: SearchBoxProps) {
    const { country } = useMarket();
    const [query, setQuery] = useState('');
    const [allAssets, setAllAssets] = useState<FeaturedAsset[]>([]);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        setAllAssets(getFeaturedAssets(country));
    }, [country]);

    useEffect(() => {
        if (!query.trim()) {
            onSearch(allAssets);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filtered = allAssets.filter(
            asset =>
                asset.symbol.toLowerCase().includes(lowerQuery) ||
                asset.name.toLowerCase().includes(lowerQuery)
        );
        onSearch(filtered);
    }, [query, allAssets, onSearch]);

    return (
        <div
            style={{
                width: '100%',
                maxWidth: '480px',
                margin: '0 auto 32px auto',
                position: 'relative',
            }}
        >
            <div
                style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(30, 41, 59, 0.75)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '14px',
                    border: isFocused
                        ? '1px solid rgba(59, 130, 246, 0.7)'
                        : '1px solid rgba(148, 163, 184, 0.2)',
                    boxShadow: isFocused
                        ? '0 0 0 3px rgba(59, 130, 246, 0.15)'
                        : '0 8px 24px rgba(0,0,0,0.25)',
                    transition: 'all 0.25s ease',
                }}
            >
                <Search
                    size={18}
                    style={{
                        marginLeft: '14px',
                        color: isFocused ? '#60a5fa' : '#94a3b8',
                        transition: 'color 0.2s ease',
                    }}
                />

                <input
                    type="text"
                    placeholder="Search assets..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    style={{
                        flex: 1,
                        padding: '14px 16px',
                        paddingLeft: '12px',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#e2e8f0',
                        fontSize: '14px',
                        width: '100%',
                        fontWeight: 500,
                        letterSpacing: '0.3px',
                    }}
                />
            </div>
        </div>
    );
}
