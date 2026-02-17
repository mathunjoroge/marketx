'use client';

import { useState } from 'react';
import { useBudgets } from '@/hooks/useBudgets';
import { useTransactions } from '@/hooks/useTransactions';
import styles from './budgets.module.css';

export default function BudgetsPage() {
    const { budgets, loading, createBudget, deleteBudget } = useBudgets();
    const { transactions } = useTransactions(20);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ category: '', amount: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.category || !form.amount) return;
        try {
            setSubmitting(true);
            await createBudget(form.category, parseFloat(form.amount));
            setForm({ category: '', amount: '' });
            setShowModal(false);
        } catch {
            // Error logged in hook
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this budget?')) return;
        await deleteBudget(id);
    };

    const getProgressColor = (progress: number) => {
        if (progress >= 100) return 'var(--accent)';
        if (progress >= 70) return '#d29922';
        return 'var(--primary)';
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Smart Budgets</h1>
                </div>
                <div className={styles.grid}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`card ${styles.skeleton}`} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Smart Budgets</h1>
                    <p className={styles.subtitle}>Track your monthly spending limits</p>
                </div>
                <button className={styles.createBtn} onClick={() => setShowModal(true)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                    New Budget
                </button>
            </div>

            {budgets.length === 0 ? (
                <div className={`card ${styles.emptyState}`}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                    <p>No budgets set yet.</p>
                    <p className={styles.emptyHint}>Create one to start tracking your spending!</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {budgets.map((budget) => (
                        <div key={budget.id} className={`card ${styles.budgetCard}`}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h3 className={styles.category}>{budget.category}</h3>
                                    <span className={styles.period}>{budget.period}</span>
                                </div>
                                <div className={styles.cardActions}>
                                    <span className={styles.statusIcon} style={{
                                        background: budget.progress >= 100 ? 'rgba(248, 81, 73, 0.15)' : 'rgba(35, 134, 54, 0.15)',
                                        color: budget.progress >= 100 ? 'var(--accent)' : 'var(--primary)',
                                    }}>
                                        {budget.progress >= 100 ? '⚠' : '↗'}
                                    </span>
                                    <button className={styles.deleteBtn} onClick={() => handleDelete(budget.id)} title="Delete">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className={styles.amounts}>
                                <span className={styles.spent}>${budget.spent.toLocaleString()} spent</span>
                                <span className={styles.limit}>of ${budget.amount.toLocaleString()}</span>
                            </div>

                            <div className={styles.progressTrack}>
                                <div
                                    className={styles.progressBar}
                                    style={{
                                        width: `${Math.min(budget.progress, 100)}%`,
                                        background: getProgressColor(budget.progress)
                                    }}
                                />
                            </div>
                            <div className={styles.progressLabel}>{budget.progress}% used</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Recent Transactions Preview */}
            {transactions.length > 0 && (
                <div className={styles.transactionsSection}>
                    <h2 className={styles.sectionTitle}>Recent Transactions</h2>
                    <div className={`card ${styles.transactionList}`}>
                        {transactions.slice(0, 5).map(t => (
                            <div key={t.id} className={styles.transactionRow}>
                                <div className={styles.txnIcon} style={{
                                    background: t.type === 'INCOME' ? 'rgba(35,134,54,0.15)' : 'rgba(248,81,73,0.15)',
                                    color: t.type === 'INCOME' ? 'var(--primary)' : 'var(--accent)',
                                }}>
                                    {t.type === 'INCOME' ? '↗' : '↙'}
                                </div>
                                <div className={styles.txnDetails}>
                                    <span className={styles.txnDesc}>{t.description}</span>
                                    <span className={styles.txnCategory}>{t.category}</span>
                                </div>
                                <span className={styles.txnAmount} style={{
                                    color: t.type === 'INCOME' ? '#3fb950' : 'var(--foreground)',
                                }}>
                                    {t.type === 'INCOME' ? '+' : '-'}${Math.abs(t.amount).toLocaleString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={`card ${styles.modal}`} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>Create New Budget</h2>
                        <form onSubmit={handleCreate} className={styles.form}>
                            <div className={styles.field}>
                                <label>Category</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Food, Transport, Entertainment"
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                />
                            </div>
                            <div className={styles.field}>
                                <label>Monthly Limit ($)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    step="0.01"
                                    placeholder="500.00"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                />
                            </div>
                            <div className={styles.formActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                                    {submitting ? 'Creating...' : 'Create Budget'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
