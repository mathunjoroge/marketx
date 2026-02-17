import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id!;

    try {
        // Fetch all relevant data
        const [bankAccounts, transactions, budgets, goals] = await Promise.all([
            prisma.bankAccount.findMany({ where: { userId } }),
            prisma.transaction.findMany({
                where: {
                    userId,
                    date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
                }
            }),
            prisma.budget.findMany({ where: { userId } }),
            prisma.goal.findMany({ where: { userId } }),
        ]);

        // --- Calculate metrics ---

        // 1. Total balance across all accounts
        const totalBalance = bankAccounts.reduce((sum, a) => sum + a.balance, 0);

        // 2. Monthly income & expenses
        const monthlyIncome = transactions
            .filter(t => t.type === 'INCOME')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const monthlyExpenses = transactions
            .filter(t => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        // 3. Savings rate (income - expenses) / income * 100
        const savingsRate = monthlyIncome > 0
            ? Math.max(0, ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100)
            : 0;

        // 4. Budget adherence: how many budgets are under limit
        let budgetAdherence = 100;
        if (budgets.length > 0) {
            const budgetResults: number[] = budgets.map(b => {
                const spent = transactions
                    .filter(t => t.category.toLowerCase() === b.category.toLowerCase() && t.type === 'EXPENSE')
                    .reduce((sum: number, t) => sum + Math.abs(t.amount), 0);
                return spent <= b.amount ? 1 : 0;
            });
            budgetAdherence = (budgetResults.reduce((sum: number, v: number) => sum + v, 0) / budgets.length) * 100;
        }

        // 5. Emergency fund: months of expenses covered by savings accounts
        const savingsBalance = bankAccounts
            .filter(a => a.type === 'SAVINGS')
            .reduce((sum, a) => sum + a.balance, 0);
        const emergencyFundMonths = monthlyExpenses > 0 ? savingsBalance / monthlyExpenses : 0;
        // Score: 0-6 months mapped to 0-100
        const emergencyFundScore = Math.min(emergencyFundMonths / 6, 1) * 100;

        // 6. Debt ratio: credit balances vs total
        const debtBalance = bankAccounts
            .filter(a => a.type === 'CREDIT')
            .reduce((sum, a) => sum + Math.abs(a.balance), 0);
        const debtRatio = totalBalance > 0 ? (debtBalance / (totalBalance + debtBalance)) * 100 : 0;
        const debtScore = Math.max(0, 100 - debtRatio);

        // 7. Goals progress
        const goalsProgress = goals.length > 0
            ? (goals.reduce((sum, g) => sum + Math.min(g.currentAmount / g.targetAmount, 1), 0) / goals.length) * 100
            : 50; // Neutral if no goals

        // --- Composite Score ---
        const score = Math.round(
            savingsRate * 0.25 +
            budgetAdherence * 0.20 +
            emergencyFundScore * 0.20 +
            debtScore * 0.20 +
            goalsProgress * 0.15
        );

        const finalScore = Math.min(100, Math.max(0, score));

        // Store snapshot
        await prisma.financialHealthScore.create({
            data: {
                userId,
                score: finalScore,
                savingsRate,
                debtRatio,
                budgetAdherence,
                emergencyFund: emergencyFundMonths,
            }
        });

        // Fetch history (last 10)
        const history = await prisma.financialHealthScore.findMany({
            where: { userId },
            orderBy: { calculatedAt: 'desc' },
            take: 10,
        });

        return NextResponse.json({
            score: finalScore,
            breakdown: {
                savingsRate: Math.round(savingsRate),
                budgetAdherence: Math.round(budgetAdherence),
                emergencyFundMonths: Math.round(emergencyFundMonths * 10) / 10,
                emergencyFundScore: Math.round(emergencyFundScore),
                debtRatio: Math.round(debtRatio),
                debtScore: Math.round(debtScore),
                goalsProgress: Math.round(goalsProgress),
            },
            summary: {
                totalBalance,
                monthlyIncome,
                monthlyExpenses,
                monthlySavings: monthlyIncome - monthlyExpenses,
                accountCount: bankAccounts.length,
                budgetCount: budgets.length,
                goalCount: goals.length,
                transactionCount: transactions.length,
            },
            history: history.map(h => ({
                score: h.score,
                date: h.calculatedAt,
            })),
        });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
