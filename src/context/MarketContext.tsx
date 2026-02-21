'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface MarketContextType {
    country: string;
    setCountry: (country: string) => void;
    showStackedEdge: boolean;
    setShowStackedEdge: (show: boolean) => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export function MarketProvider({ children }: { children: React.ReactNode }) {
    const [country, setCountry] = useState('US');
    const [showStackedEdge, setShowStackedEdge] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        let isCancelled = false;
        Promise.resolve().then(() => {
            if (!isCancelled) setMounted(true);
        });
        return () => { isCancelled = true; };
    }, []);

    useEffect(() => {
        if (!mounted) return;

        fetch('/api/geo')
            .then(res => res.json())
            .then(data => {
                if (data.country) {
                    setCountry(data.country);
                }
            })
            .catch(console.error);
    }, [mounted]);

    return (
        <MarketContext.Provider value={{ country, setCountry, showStackedEdge, setShowStackedEdge }}>
            {children}
        </MarketContext.Provider>
    );
}

export function useMarket() {
    const context = useContext(MarketContext);
    if (context === undefined) {
        throw new Error('useMarket must be used within a MarketProvider');
    }
    return context;
}
