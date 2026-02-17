import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { generateStructuredAdvice, AIAdvice } from '@/lib/ai/gemini';
import logger from '@/lib/logger';

export const maxDuration = 60; // Allow longer timeout for AI generation

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // 1. Fetch Financial Context
        // We need to gather data from the new banking tables
        const results = await Promise.all([
            prisma.bankAccount.findMany({ where: { userId } }),
            prisma.transaction.findMany({
                where: { userId },
                orderBy: { date: 'desc' },
                take: 50
            }),
            prisma.budget.findMany({ where: { userId } }),
            prisma.userSettings.findUnique({ where: { userId } }),
            prisma.account.findMany({ where: { userId } }), // NextAuth accounts
            prisma.affiliateProduct.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    category: true,
                    provider: true,
                    affiliateUrl: true
                }
            }),
            prisma.goal.findMany({ where: { userId } }),
        ]);

        const [
            bankAccounts,
            transactions,
            budgets,
            userSettings,
            portfolio,
            availableProducts,
            goals
        ] = [
                results[0],
                results[1],
                results[2],
                results[3],
                results[4],
                results[5],
                results[6]
            ];

        const trades = await prisma.trade.findMany({
            where: {
                userId,
                status: 'OPEN'
            }
        });

        // 2. Calculate derived metrics
        const totalCash = bankAccounts.reduce((sum: number, acc: any) => sum + (acc.balance || 0), 0);
        const monthlyIncome = transactions
            .filter((t: any) => t.type === 'INCOME' && t.amount > 0)
            .reduce((sum: number, t: any) => sum + t.amount, 0);

        // Simple heuristic for expenses (assuming standard flow, or we'd need more logic)
        const recentExpenses = transactions
            .filter((t: any) => t.type === 'EXPENSE' || t.amount < 0)
            .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

        const savingsRate = monthlyIncome > 0
            ? Math.round(((monthlyIncome - recentExpenses) / monthlyIncome) * 100)
            : 0;

        const context = {
            userProfile: {
                riskTolerance: userSettings?.defaultRiskPercent ? (userSettings.defaultRiskPercent > 2 ? 'HIGH' : 'LOW') : 'MEDIUM',
                currency: userSettings?.currency || 'USD'
            },
            financials: {
                totalCash,
                monthlyIncome,
                monthlyExpenses: recentExpenses,
                savingsRate,
                recentTransactionVolume: transactions.length,
                numberOfBudgets: budgets.length
            },
            goals: (goals as any[]).map((g: any) => ({
                name: g.name,
                targetAmount: g.targetAmount,
                currentAmount: g.currentAmount,
                progress: Math.round((g.currentAmount / g.targetAmount) * 100),
                deadline: g.deadline,
                category: g.category,
            })),
            portfolio: {
                openPositions: trades.length,
                holdings: trades.map(t => t.symbol)
            },
            marketData: {
                // We can inject "Top Gainers" here if we had them, or let AI use its knowledge
                availableAssetClasses: ["Crypto", "Stocks", "ETFs"]
            }
        };

        // 3. Generate Advice
        const advice = await generateStructuredAdvice(context, availableProducts);

        return NextResponse.json(advice);

    } catch (error: any) {
        logger.error(`Advisor API Error: ${error.message}`);
        return NextResponse.json(
            { message: 'Failed to generate advice', error: error.message },
            { status: 500 }
        );
    }
}
