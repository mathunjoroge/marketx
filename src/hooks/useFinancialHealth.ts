'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface HealthBreakdown {
    savingsRate: number;
    budgetAdherence: number;
    emergencyFundMonths: number;
    emergencyFundScore: number;
    debtRatio: number;
    debtScore: number;
    goalsProgress: number;
}

export interface HealthSummary {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    monthlySavings: number;
    accountCount: number;
    budgetCount: number;
    goalCount: number;
    transactionCount: number;
}

export interface FinancialHealth {
    score: number;
    breakdown: HealthBreakdown;
    summary: HealthSummary;
    history: { score: number; date: string }[];
}

export function useFinancialHealth() {
    const { status } = useSession();
    const [health, setHealth] = useState<FinancialHealth | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHealth = useCallback(async () => {
        if (status !== 'authenticated') return;
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/financial-health');
            if (!res.ok) throw new Error('Failed to fetch health score');
            setHealth(await res.json());
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error checking health';
            setError(message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [status]);

    return { health, loading, error, fetchHealth };
}
