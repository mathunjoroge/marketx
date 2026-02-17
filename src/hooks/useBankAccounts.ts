'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface BankAccount {
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    institution?: string;
    createdAt: string;
    _count?: { transactions: number };
}

export function useBankAccounts() {
    const { status } = useSession();
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAccounts = useCallback(async () => {
        if (status !== 'authenticated') { setLoading(false); return; }
        try {
            setLoading(true);
            const res = await fetch('/api/bank-accounts');
            if (!res.ok) throw new Error('Failed to fetch accounts');
            setAccounts(await res.json());
        } catch (err) {
            console.error(err);
            setError('Failed to load accounts');
        } finally {
            setLoading(false);
        }
    }, [status]);

    useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

    const createAccount = async (data: { name: string; type: string; balance?: number; currency?: string; institution?: string }) => {
        const res = await fetch('/api/bank-accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create account');
        await fetchAccounts();
    };

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

    return { accounts, loading, error, fetchAccounts, createAccount, totalBalance };
}
