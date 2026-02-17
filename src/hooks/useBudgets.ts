'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface Budget {
    id: string;
    category: string;
    amount: number;
    period: string;
    spent: number;
    progress: number;
    createdAt: string;
    updatedAt: string;
}

export function useBudgets() {
    const { status } = useSession();
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBudgets = useCallback(async () => {
        if (status !== 'authenticated') {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const res = await fetch('/api/budgets');
            if (!res.ok) throw new Error('Failed to fetch budgets');
            const data = await res.json();
            setBudgets(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load budgets');
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => {
        fetchBudgets();
    }, [fetchBudgets]);

    const createBudget = async (category: string, amount: number, period: string = 'MONTHLY') => {
        try {
            const res = await fetch('/api/budgets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, amount, period }),
            });
            if (!res.ok) throw new Error('Failed to create budget');
            await fetchBudgets(); // Re-fetch to get enriched data (spent/progress)
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const deleteBudget = async (id: string) => {
        try {
            // Optimistic
            setBudgets(prev => prev.filter(b => b.id !== id));
            const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                await fetchBudgets(); // Revert
                throw new Error('Failed to delete budget');
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    return {
        budgets,
        loading,
        error,
        fetchBudgets,
        createBudget,
        deleteBudget,
    };
}
