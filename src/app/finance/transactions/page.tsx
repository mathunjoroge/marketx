'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTransactions } from '@/hooks/useTransactions';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import styles from './transactions.module.css';

const CATEGORIES = [
    'Salary', 'Freelance', 'Investment Returns', 'Gifts',
    'Food', 'Transport', 'Housing', 'Utilities', 'Entertainment',
    'Healthcare', 'Shopping', 'Education', 'Subscriptions', 'Other'
];

export default function TransactionsPage() {
    const { transactions, loading, addTransaction, deleteTransaction } = useTransactions(200);
    const { accounts } = useBankAccounts();
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
    const [form, setForm] = useState({
        amount: '', category: 'Other', description: '', type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
        bankAccountId: '', date: new Date().toISOString().split('T')[0],
    });
    const [submitting, setSubmitting] = useState(false);

    const filtered = transactions.filter(t => filter === 'ALL' || t.type === filter);

    const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalExpenses = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Math.abs(t.amount), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.amount || !form.bankAccountId) return;
        setSubmitting(true);
        try {
            await addTransaction({
                amount: parseFloat(form.amount),
                category: form.category,
                description: form.description || form.category,
                type: form.type,
                bankAccountId: form.bankAccountId,
                date: new Date(form.date).toISOString(),
            });
            setShowModal(false);
            setForm({ amount: '', category: 'Other', description: '', type: 'EXPENSE', bankAccountId: '', date: new Date().toISOString().split('T')[0] });
        } catch { /* handled by hook */ }
        setSubmitting(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <Link href="/finance" className={styles.backLink}>← Finance</Link>
                    <h1 className={styles.title}>Transactions</h1>
                </div>
                <button className={styles.addBtn} onClick={() => setShowModal(true)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                    Add Transaction
                </button>
            </div>

            {/* Stats Bar */}
            <div className={styles.statsBar}>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>Income</span>
                    <span className={styles.statValue} style={{ color: '#3fb950' }}>+${totalIncome.toLocaleString()}</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>Expenses</span>
                    <span className={styles.statValue} style={{ color: '#f85149' }}>-${totalExpenses.toLocaleString()}</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>Net</span>
                    <span className={styles.statValue} style={{ color: totalIncome - totalExpenses >= 0 ? '#3fb950' : '#f85149' }}>
                        ${(totalIncome - totalExpenses).toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className={styles.filterTabs}>
                {(['ALL', 'INCOME', 'EXPENSE'] as const).map(f => (
                    <button key={f} className={`${styles.filterTab} ${filter === f ? styles.filterActive : ''}`} onClick={() => setFilter(f)}>
                        {f === 'ALL' ? 'All' : f === 'INCOME' ? '↗ Income' : '↙ Expenses'}
                    </button>
                ))}
            </div>

            {/* Transaction List */}
            {loading ? (
                <div className={styles.skeletons}>{[1, 2, 3, 4, 5].map(i => <div key={i} className={styles.skeleton} />)}</div>
            ) : filtered.length === 0 ? (
                <div className={`card ${styles.emptyState}`}>
                    <p>No transactions found.</p>
                    <button className={styles.addBtn} onClick={() => setShowModal(true)}>Add Your First Transaction</button>
                </div>
            ) : (
                <div className={`card ${styles.txnList}`}>
                    {filtered.map(t => (
                        <div key={t.id} className={styles.txnRow}>
                            <div className={styles.txnIcon} style={{
                                background: t.type === 'INCOME' ? 'rgba(35,134,54,0.15)' : 'rgba(248,81,73,0.15)',
                                color: t.type === 'INCOME' ? '#3fb950' : '#f85149',
                            }}>
                                {t.type === 'INCOME' ? '↗' : '↙'}
                            </div>
                            <div className={styles.txnDetails}>
                                <span className={styles.txnDesc}>{t.description}</span>
                                <span className={styles.txnMeta}>{t.category} · {new Date(t.date).toLocaleDateString()} {t.bankAccount?.name ? `· ${t.bankAccount.name}` : ''}</span>
                            </div>
                            <span className={styles.txnAmount} style={{ color: t.type === 'INCOME' ? '#3fb950' : 'var(--foreground)' }}>
                                {t.type === 'INCOME' ? '+' : '-'}${Math.abs(t.amount).toLocaleString()}
                            </span>
                            <button className={styles.deleteBtn} onClick={() => deleteTransaction(t.id)} title="Delete">×</button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Transaction Modal */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={`card ${styles.modal}`} onClick={e => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>Add Transaction</h2>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            {/* Type Toggle */}
                            <div className={styles.typeToggle}>
                                <button type="button" className={`${styles.typeBtn} ${form.type === 'EXPENSE' ? styles.typeBtnActive : ''}`}
                                    style={form.type === 'EXPENSE' ? { background: 'rgba(248,81,73,0.15)', color: '#f85149', borderColor: '#f85149' } : {}}
                                    onClick={() => setForm(f => ({ ...f, type: 'EXPENSE' }))}>↙ Expense</button>
                                <button type="button" className={`${styles.typeBtn} ${form.type === 'INCOME' ? styles.typeBtnActive : ''}`}
                                    style={form.type === 'INCOME' ? { background: 'rgba(35,134,54,0.15)', color: '#3fb950', borderColor: '#3fb950' } : {}}
                                    onClick={() => setForm(f => ({ ...f, type: 'INCOME' }))}>↗ Income</button>
                            </div>

                            <div className={styles.field}>
                                <label>Amount ($)</label>
                                <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" required autoFocus />
                            </div>

                            <div className={styles.field}>
                                <label>Category</label>
                                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>

                            <div className={styles.field}>
                                <label>Description</label>
                                <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What was this for?" />
                            </div>

                            <div className={styles.field}>
                                <label>Account</label>
                                <select value={form.bankAccountId} onChange={e => setForm(f => ({ ...f, bankAccountId: e.target.value }))} required>
                                    <option value="">Select account...</option>
                                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (${a.balance.toLocaleString()})</option>)}
                                </select>
                                {accounts.length === 0 && <p className={styles.hint}>You need to create a bank account first on the Finance page.</p>}
                            </div>

                            <div className={styles.field}>
                                <label>Date</label>
                                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                            </div>

                            <div className={styles.formActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className={styles.submitBtn} disabled={submitting || !form.amount || !form.bankAccountId}>
                                    {submitting ? 'Adding...' : 'Add Transaction'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
