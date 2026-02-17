'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface Goal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline?: string | null;
    category?: string | null;
    progress: number;
    remaining: number;
    isComplete: boolean;
    createdAt: string;
    updatedAt: string;
}

export function useGoals() {
    const { status } = useSession();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGoals = useCallback(async () => {
        if (status !== 'authenticated') { setLoading(false); return; }
        try {
            setLoading(true);
            const res = await fetch('/api/goals');
            if (!res.ok) throw new Error('Failed to fetch goals');
            setGoals(await res.json());
        } catch (err) {
            console.error(err);
            setError('Failed to load goals');
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => { fetchGoals(); }, [fetchGoals]);

    const createGoal = async (data: { name: string; targetAmount: number; deadline?: string; category?: string }) => {
        const res = await fetch('/api/goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create goal');
        await fetchGoals();
    };

    const addFunds = async (id: string, amount: number) => {
        const res = await fetch(`/api/goals/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ addAmount: amount }),
        });
        if (!res.ok) throw new Error('Failed to add funds');
        await fetchGoals();
    };

    const deleteGoal = async (id: string) => {
        setGoals(prev => prev.filter(g => g.id !== id));
        const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            await fetchGoals();
            throw new Error('Failed to delete goal');
        }
    };

    return { goals, loading, error, fetchGoals, createGoal, addFunds, deleteGoal };
}
