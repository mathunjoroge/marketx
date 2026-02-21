'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface TradingSuggestion {
    symbol: string;
    action: 'BUY' | 'SELL' | 'HOLD';
    reason: string;
    confidence: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    allocationPercent: number;
}

export interface AffiliateProduct {
    id: string;
    name: string;
    description: string;
    category: string;
    provider: string;
    affiliateUrl: string;
    reason?: string;
}

export interface AIAdvice {
    summary: string;
    recommendations: string[];
    tradingSuggestions: TradingSuggestion[];
    productSuggestions?: AffiliateProduct[];
}

export function useAdvisor() {
    const { status } = useSession();
    const [advice, setAdvice] = useState<AIAdvice | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getAdvice = useCallback(async () => {
        if (status !== 'authenticated') return;
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/ai/advisor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error('Failed to get advice');
            const data = await res.json();
            setAdvice(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error getting advice';
            console.error(err);
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [status]);

    return {
        advice,
        loading,
        error,
        getAdvice,
    };
}
