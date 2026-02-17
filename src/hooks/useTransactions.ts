'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface Transaction {
    id: string;
    amount: number;
    category: string;
    description: string;
    type: 'INCOME' | 'EXPENSE';
    date: string;
    bankAccountId: string;
    bankAccount?: { name: string; currency: string };
    createdAt: string;
}

export function useTransactions(limit: number = 50) {
    const { status } = useSession();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTransactions = useCallback(async () => {
        if (status !== 'authenticated') {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const res = await fetch(`/api/transactions?limit=${limit}`);
            if (!res.ok) throw new Error('Failed to fetch transactions');
            const data = await res.json();
            setTransactions(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    }, [status, limit]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const addTransaction = async (data: {
        amount: number;
        category: string;
        description: string;
        type: 'INCOME' | 'EXPENSE';
        bankAccountId: string;
        date?: string;
    }) => {
        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error('Failed to add transaction');
            await fetchTransactions();
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const deleteTransaction = async (id: string) => {
        try {
            setTransactions(prev => prev.filter(t => t.id !== id));
            const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                await fetchTransactions();
                throw new Error('Failed to delete transaction');
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    return {
        transactions,
        loading,
        error,
        fetchTransactions,
        addTransaction,
        deleteTransaction,
    };
}
