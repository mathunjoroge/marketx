'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGoals } from '@/hooks/useGoals';
import styles from './goals.module.css';

export default function GoalsPage() {
    const { goals, loading, createGoal, addFunds, deleteGoal } = useGoals();
    const [showCreate, setShowCreate] = useState(false);
    const [showFund, setShowFund] = useState<string | null>(null);
    const [fundAmount, setFundAmount] = useState('');
    const [createForm, setCreateForm] = useState({ name: '', targetAmount: '', deadline: '', category: '' });
    const [submitting, setSubmitting] = useState(false);

    const completedGoals = goals.filter(g => g.isComplete).length;

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!createForm.name || !createForm.targetAmount) return;
        setSubmitting(true);
        try {
            await createGoal({
                name: createForm.name,
                targetAmount: parseFloat(createForm.targetAmount),
                deadline: createForm.deadline ? new Date(createForm.deadline).toISOString() : undefined,
                category: createForm.category || undefined,
            });
            setShowCreate(false);
            setCreateForm({ name: '', targetAmount: '', deadline: '', category: '' });
        } catch { /* handled */ }
        setSubmitting(false);
    };

    const handleFund = async (id: string) => {
        if (!fundAmount || parseFloat(fundAmount) <= 0) return;
        setSubmitting(true);
        try {
            await addFunds(id, parseFloat(fundAmount));
            setShowFund(null);
            setFundAmount('');
        } catch { /* handled */ }
        setSubmitting(false);
    };

    const getProgressColor = (pct: number) => {
        if (pct >= 100) return '#3fb950';
        if (pct >= 75) return '#1f6feb';
        if (pct >= 50) return '#d29922';
        return '#8b949e';
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <Link href="/finance" className={styles.backLink}>← Finance</Link>
                    <h1 className={styles.title}>🎯 Financial Goals</h1>
                    <p className={styles.subtitle}>{completedGoals}/{goals.length} completed</p>
                </div>
                <button className={styles.createBtn} onClick={() => setShowCreate(true)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                    New Goal
                </button>
            </div>

            {loading ? (
                <div className={styles.grid}>
                    {[1, 2, 3].map(i => <div key={i} className={`card ${styles.skeleton}`} />)}
                </div>
            ) : goals.length === 0 ? (
                <div className={`card ${styles.emptyState}`}>
                    <span style={{ fontSize: '2.5rem' }}>🎯</span>
                    <h3>Set Your First Goal</h3>
                    <p>Save for emergencies, vacations, or a down payment.</p>
                    <button className={styles.createBtn} onClick={() => setShowCreate(true)}>Create a Goal</button>
                </div>
            ) : (
                <div className={styles.grid}>
                    {goals.map(goal => (
                        <div key={goal.id} className={`card ${styles.goalCard} ${goal.isComplete ? styles.goalComplete : ''}`}>
                            <div className={styles.goalHeader}>
                                <div>
                                    <h3 className={styles.goalName}>{goal.name}</h3>
                                    {goal.category && <span className={styles.goalCategory}>{goal.category}</span>}
                                </div>
                                <div className={styles.goalActions}>
                                    {goal.isComplete && <span className={styles.completeBadge}>✓ Done</span>}
                                    <button className={styles.deleteBtn} onClick={() => deleteGoal(goal.id)} title="Delete">×</button>
                                </div>
                            </div>

                            <div className={styles.goalAmounts}>
                                <span className={styles.goalCurrent}>${goal.currentAmount.toLocaleString()}</span>
                                <span className={styles.goalTarget}>/ ${goal.targetAmount.toLocaleString()}</span>
                            </div>

                            <div className={styles.progressTrack}>
                                <div className={styles.progressBar} style={{
                                    width: `${goal.progress}%`,
                                    background: getProgressColor(goal.progress)
                                }} />
                            </div>
                            <div className={styles.progressInfo}>
                                <span>{goal.progress}%</span>
                                <span>${goal.remaining.toLocaleString()} remaining</span>
                            </div>

                            {goal.deadline && (
                                <div className={styles.deadline}>
                                    📅 {new Date(goal.deadline).toLocaleDateString()}
                                </div>
                            )}

                            {!goal.isComplete && (
                                showFund === goal.id ? (
                                    <div className={styles.fundForm}>
                                        <input type="number" min="0" step="0.01" value={fundAmount}
                                            onChange={e => setFundAmount(e.target.value)} placeholder="Amount to add" autoFocus />
                                        <div className={styles.fundActions}>
                                            <button className={styles.cancelBtn} onClick={() => { setShowFund(null); setFundAmount(''); }}>Cancel</button>
                                            <button className={styles.fundBtn} disabled={submitting || !fundAmount} onClick={() => handleFund(goal.id)}>
                                                {submitting ? '...' : 'Add'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button className={styles.addFundsBtn} onClick={() => setShowFund(goal.id)}>
                                        💰 Add Funds
                                    </button>
                                )
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create Goal Modal */}
            {showCreate && (
                <div className={styles.modalOverlay} onClick={() => setShowCreate(false)}>
                    <div className={`card ${styles.modal}`} onClick={e => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>Create New Goal</h2>
                        <form onSubmit={handleCreate} className={styles.form}>
                            <div className={styles.field}>
                                <label>Goal Name</label>
                                <input type="text" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Emergency Fund" required autoFocus />
                            </div>
                            <div className={styles.field}>
                                <label>Target Amount ($)</label>
                                <input type="number" min="1" step="0.01" value={createForm.targetAmount} onChange={e => setCreateForm(f => ({ ...f, targetAmount: e.target.value }))} placeholder="10000" required />
                            </div>
                            <div className={styles.field}>
                                <label>Category (optional)</label>
                                <select value={createForm.category} onChange={e => setCreateForm(f => ({ ...f, category: e.target.value }))}>
                                    <option value="">None</option>
                                    <option>Emergency Fund</option>
                                    <option>Vacation</option>
                                    <option>Down Payment</option>
                                    <option>Retirement</option>
                                    <option>Education</option>
                                    <option>Vehicle</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div className={styles.field}>
                                <label>Deadline (optional)</label>
                                <input type="date" value={createForm.deadline} onChange={e => setCreateForm(f => ({ ...f, deadline: e.target.value }))} />
                            </div>
                            <div className={styles.formActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setShowCreate(false)}>Cancel</button>
                                <button type="submit" className={styles.submitBtn} disabled={submitting || !createForm.name || !createForm.targetAmount}>
                                    {submitting ? 'Creating...' : 'Create Goal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
