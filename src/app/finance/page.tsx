'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useBankAccounts } from '@/hooks/useBankAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { useGoals } from '@/hooks/useGoals';
import { useFinancialHealth } from '@/hooks/useFinancialHealth';
import styles from './finance.module.css';
import AuthGuard from '@/components/auth/AuthGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function FinanceDashboard() {
    const { accounts, totalBalance, loading: accountsLoading, createAccount } = useBankAccounts();
    const { transactions, loading: txnLoading } = useTransactions(10);
    const { goals } = useGoals();
    const { health, loading: healthLoading, fetchHealth } = useFinancialHealth();

    const [showAccountModal, setShowAccountModal] = useState(false);
    const [accountForm, setAccountForm] = useState({ name: '', type: 'CHECKING', balance: '', institution: '' });
    const [accountSubmitting, setAccountSubmitting] = useState(false);

    useEffect(() => { fetchHealth(); }, [fetchHealth]);

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accountForm.name) return;
        setAccountSubmitting(true);
        try {
            await createAccount({
                name: accountForm.name,
                type: accountForm.type,
                balance: accountForm.balance ? parseFloat(accountForm.balance) : 0,
                institution: accountForm.institution || undefined
            });
            setShowAccountModal(false);
            setAccountForm({ name: '', type: 'CHECKING', balance: '', institution: '' });
        } catch (err) {
            console.error(err);
        } finally {
            setAccountSubmitting(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return '#3fb950';
        if (score >= 60) return '#1f6feb';
        if (score >= 40) return '#d29922';
        return '#f85149';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Needs Work';
    };

    const isInitialLoading = accountsLoading && txnLoading;

    if (isInitialLoading) {
        return (
            <AuthGuard>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div>
                            <h1 className={styles.title}>💰 Financial Health</h1>
                            <p className={styles.subtitle}>Track income, expenses, savings & goals</p>
                        </div>
                    </div>
                    <div className={styles.skeletonGrid}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={styles.skeletonCard} />
                        ))}
                    </div>
                    <div className={styles.skeletonMainGrid}>
                        <div className={styles.loadingPulse} />
                        <div className={styles.loadingPulse} />
                    </div>
                    <div className={styles.skeletonContainer}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className={styles.skeletonRow} />
                        ))}
                    </div>
                </div>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>💰 Financial Health</h1>
                        <p className={styles.subtitle}>Track income, expenses, savings & goals</p>
                    </div>
                    <div className={styles.headerActions}>
                        <Link href="/finance/transactions" className={styles.actionBtn}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                            Transactions
                        </Link>
                        <Link href="/finance/goals" className={styles.actionBtn}>
                            🎯 Goals
                        </Link>
                        <Link href="/advisor" className={styles.advisorBtn}>
                            ✦ AI Advisor
                        </Link>
                    </div>
                </div>

                {/* Summary Cards */}
                <ErrorBoundary>
                    <div className={styles.summaryGrid}>
                        <div className={`card ${styles.summaryCard}`}>
                            <span className={styles.cardIcon} style={{ background: 'rgba(31,111,235,0.15)', color: '#58a6ff' }}>💳</span>
                            <div>
                                <span className={styles.cardLabel}>Total Balance</span>
                                <span className={styles.cardValue}>${totalBalance.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className={`card ${styles.summaryCard}`}>
                            <span className={styles.cardIcon} style={{ background: 'rgba(35,134,54,0.15)', color: '#3fb950' }}>📈</span>
                            <div>
                                <span className={styles.cardLabel}>Monthly Income</span>
                                <span className={styles.cardValue} style={{ color: '#3fb950' }}>
                                    ${(health?.summary.monthlyIncome || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div className={`card ${styles.summaryCard}`}>
                            <span className={styles.cardIcon} style={{ background: 'rgba(248,81,73,0.15)', color: '#f85149' }}>📉</span>
                            <div>
                                <span className={styles.cardLabel}>Monthly Expenses</span>
                                <span className={styles.cardValue} style={{ color: '#f85149' }}>
                                    ${(health?.summary.monthlyExpenses || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div className={`card ${styles.summaryCard}`}>
                            <span className={styles.cardIcon} style={{ background: 'rgba(63,185,80,0.15)', color: '#3fb950' }}>🏦</span>
                            <div>
                                <span className={styles.cardLabel}>Savings Rate</span>
                                <span className={styles.cardValue}>
                                    {health?.breakdown.savingsRate || 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                </ErrorBoundary>

                {/* Main Content Grid */}
                <div className={styles.mainGrid}>
                    {/* Health Score */}
                    <ErrorBoundary>
                        <div className={`card ${styles.healthCard}`}>
                            <h2 className={styles.sectionTitle}>Financial Health Score</h2>
                            {healthLoading ? (
                                <div className={styles.loadingPulse} />
                            ) : health ? (
                                <div className={styles.scoreContainer}>
                                    <div className={styles.scoreGauge}>
                                        <svg viewBox="0 0 120 120" className={styles.gaugeSvg}>
                                            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                                            <circle
                                                cx="60" cy="60" r="50" fill="none"
                                                stroke={getScoreColor(health.score)}
                                                strokeWidth="10"
                                                strokeDasharray={`${(health.score / 100) * 314} 314`}
                                                strokeLinecap="round"
                                                transform="rotate(-90 60 60)"
                                                style={{ transition: 'stroke-dasharray 1s ease' }}
                                            />
                                        </svg>
                                        <div className={styles.scoreValue}>
                                            <span className={styles.scoreNumber}>{health.score}</span>
                                            <span className={styles.scoreMax}>/100</span>
                                        </div>
                                    </div>
                                    <span className={styles.scoreLabel} style={{ color: getScoreColor(health.score) }}>
                                        {getScoreLabel(health.score)}
                                    </span>

                                    <div className={styles.breakdownList}>
                                        {[
                                            { label: 'Savings Rate', value: `${health.breakdown.savingsRate}%`, pct: health.breakdown.savingsRate },
                                            { label: 'Budget Adherence', value: `${health.breakdown.budgetAdherence}%`, pct: health.breakdown.budgetAdherence },
                                            { label: 'Emergency Fund', value: `${health.breakdown.emergencyFundMonths} mo`, pct: health.breakdown.emergencyFundScore },
                                            { label: 'Debt Score', value: `${health.breakdown.debtScore}%`, pct: health.breakdown.debtScore },
                                            { label: 'Goals Progress', value: `${health.breakdown.goalsProgress}%`, pct: health.breakdown.goalsProgress },
                                        ].map(item => (
                                            <div key={item.label} className={styles.breakdownItem}>
                                                <div className={styles.breakdownLabel}>
                                                    <span>{item.label}</span>
                                                    <span className={styles.breakdownValue}>{item.value}</span>
                                                </div>
                                                <div className={styles.breakdownTrack}>
                                                    <div className={styles.breakdownBar} style={{ width: `${Math.min(item.pct, 100)}%`, background: getScoreColor(item.pct) }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.emptyHealth}>
                                    <p>Compute your score to see how you are doing.</p>
                                    <button className={styles.computeBtn} onClick={fetchHealth}>Compute Score</button>
                                </div>
                            )}
                        </div>
                    </ErrorBoundary>

                    {/* Accounts */}
                    <ErrorBoundary>
                        <div className={`card ${styles.accountsCard}`}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>Accounts</h2>
                                <button className={styles.addSmallBtn} onClick={() => setShowAccountModal(true)}>+</button>
                            </div>
                            {accounts.length === 0 ? (
                                <div className={styles.emptyAccounts}>
                                    <p className={styles.emptyText}>No accounts yet.</p>
                                    <button className={styles.addBtn} onClick={() => setShowAccountModal(true)}>Add Account</button>
                                </div>
                            ) : (
                                <div className={styles.accountList}>
                                    {accounts.map(a => (
                                        <div key={a.id} className={styles.accountRow}>
                                            <div className={styles.accountInfo}>
                                                <span className={styles.accountIcon}>
                                                    {a.type === 'SAVINGS' ? '🏦' : a.type === 'CREDIT' ? '💳' : a.type === 'INVESTMENT' ? '📊' : '🏧'}
                                                </span>
                                                <div>
                                                    <span className={styles.accountName}>{a.name}</span>
                                                    <span className={styles.accountType}>{a.type}</span>
                                                </div>
                                            </div>
                                            <span className={styles.accountBalance} style={{ color: a.balance >= 0 ? '#3fb950' : '#f85149' }}>
                                                ${a.balance.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </ErrorBoundary>
                </div>

                {/* Account Modal */}
                {showAccountModal && (
                    <div className={styles.modalOverlay} onClick={() => setShowAccountModal(false)}>
                        <div className={`card ${styles.modal}`} onClick={e => e.stopPropagation()}>
                            <h3 className={styles.modalTitle}>Add Bank Account</h3>
                            <form onSubmit={handleCreateAccount} className={styles.formSplit}>
                                <div className={styles.field}>
                                    <label>Account Name</label>
                                    <input type="text" placeholder="e.g. Chase Checkings" value={accountForm.name}
                                        onChange={e => setAccountForm((f: any) => ({ ...f, name: e.target.value }))} required autoFocus />
                                </div>
                                <div className={styles.field}>
                                    <label>Account Type</label>
                                    <select value={accountForm.type} onChange={e => setAccountForm((f: any) => ({ ...f, type: e.target.value }))}>
                                        <option value="CHECKING">Checking</option>
                                        <option value="SAVINGS">Savings</option>
                                        <option value="CREDIT">Credit Card</option>
                                        <option value="INVESTMENT">Investment</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                                <div className={styles.field}>
                                    <label>Initial Balance ($)</label>
                                    <input type="number" step="0.01" value={accountForm.balance}
                                        onChange={e => setAccountForm((f: any) => ({ ...f, balance: e.target.value }))} placeholder="0.00" />
                                </div>
                                <div className={styles.field}>
                                    <label>Institution (Optional)</label>
                                    <input type="text" placeholder="e.g. Chase Bank" value={accountForm.institution}
                                        onChange={e => setAccountForm((f: any) => ({ ...f, institution: e.target.value }))} />
                                </div>
                                <div className={styles.formActions}>
                                    <button type="button" className={styles.cancelBtn} onClick={() => setShowAccountModal(false)}>Cancel</button>
                                    <button type="submit" className={styles.submitBtn} disabled={accountSubmitting || !accountForm.name}>
                                        {accountSubmitting ? 'Creating...' : 'Create Account'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Goals Overview */}
                {goals.length > 0 && (
                    <ErrorBoundary>
                        <div className={styles.goalsSection}>
                            <div className={styles.sectionHeader}>
                                <h2 className={styles.sectionTitle}>🎯 Goals Progress</h2>
                                <Link href="/finance/goals" className={styles.viewAllLink}>View All →</Link>
                            </div>
                            <div className={styles.goalsGrid}>
                                {goals.slice(0, 4).map(goal => (
                                    <div key={goal.id} className={`card ${styles.goalMini}`}>
                                        <div className={styles.goalMiniHeader}>
                                            <span className={styles.goalMiniName}>{goal.name}</span>
                                            {goal.isComplete && <span className={styles.completeBadge}>✓</span>}
                                        </div>
                                        <div className={styles.goalMiniAmounts}>
                                            <span>${goal.currentAmount.toLocaleString()}</span>
                                            <span className={styles.goalMiniTarget}>/ ${goal.targetAmount.toLocaleString()}</span>
                                        </div>
                                        <div className={styles.goalMiniTrack}>
                                            <div className={styles.goalMiniBar} style={{
                                                width: `${goal.progress}%`,
                                                background: goal.isComplete ? '#3fb950' : '#1f6feb'
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ErrorBoundary>
                )}

                {/* Recent Transactions */}
                <ErrorBoundary>
                    <div className={styles.txnSection}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Recent Transactions</h2>
                            <Link href="/finance/transactions" className={styles.viewAllLink}>View All →</Link>
                        </div>
                        {transactions.length === 0 ? (
                            <div className={`card ${styles.emptyCard}`}>
                                <p>No transactions recorded yet.</p>
                                <Link href="/finance/transactions" className={styles.actionBtn}>Add Your First Transaction</Link>
                            </div>
                        ) : (
                            <div className={`card ${styles.txnList}`}>
                                {transactions.slice(0, 8).map(t => (
                                    <div key={t.id} className={styles.txnRow}>
                                        <div className={styles.txnIcon} style={{
                                            background: t.type === 'INCOME' ? 'rgba(35,134,54,0.15)' : 'rgba(248,81,73,0.15)',
                                            color: t.type === 'INCOME' ? '#3fb950' : '#f85149',
                                        }}>
                                            {t.type === 'INCOME' ? '↗' : '↙'}
                                        </div>
                                        <div className={styles.txnDetails}>
                                            <span className={styles.txnDesc}>{t.description}</span>
                                            <span className={styles.txnCategory}>{t.category} · {new Date(t.date).toLocaleDateString()}</span>
                                        </div>
                                        <span className={styles.txnAmount} style={{ color: t.type === 'INCOME' ? '#3fb950' : 'var(--foreground)' }}>
                                            {t.type === 'INCOME' ? '+' : '-'}${Math.abs(t.amount).toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ErrorBoundary>
            </div>
        </AuthGuard>
    );
}
