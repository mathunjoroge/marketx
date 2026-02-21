import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { generateStructuredAdvice, AIAdvice } from '@/lib/ai/gemini';
import { rateLimit } from '@/lib/rate-limit';
import { getUserSubscriptionTier, TIER_CONFIGS } from '@/lib/subscription';
import logger from '@/lib/logger';

export const maxDuration = 60; // Allow longer timeout for AI generation

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id!;

        // 1. Subscription & Rate Limiting Verification
        const tier = await getUserSubscriptionTier(userId);
        const config = TIER_CONFIGS[tier];

        // Rate limit based on identifier + tier limits (using 24h window for "per day" limits)
        const limitResult = await rateLimit(`ai-advisor:${userId}`, config.aiCallLimit, 86400);

        if (!limitResult.success) {
            return NextResponse.json({
                message: `You have reached your daily limit for AI advice on the ${tier} tier. Upgrade your plan for more limits.`,
                limit: limitResult.limit,
                reset: limitResult.reset
            }, {
                status: 429,
                headers: {
                    'X-RateLimit-Limit': limitResult.limit.toString(),
                    'X-RateLimit-Remaining': limitResult.remaining.toString(),
                    'X-RateLimit-Reset': limitResult.reset.toString()
                }
            });
        }

        // 2. Fetch Financial Context
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
            prisma.userCredentials.findUnique({ where: { userId } }),
        ]);

        const [
            bankAccounts,
            transactions,
            budgets,
            userSettings,
            portfolio,
            availableProducts,
            goals,
            userCredentials
        ] = results;

        const trades = await prisma.trade.findMany({
            where: {
                userId,
                status: 'OPEN'
            }
        });

        // 3. Calculate derived metrics
        const totalCash = bankAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
        const monthlyIncome = transactions
            .filter(t => t.type === 'INCOME' && t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);

        // Simple heuristic for expenses (assuming standard flow, or we'd need more logic)
        const recentExpenses = transactions
            .filter(t => t.type === 'EXPENSE' || t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

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
                numberOfBudgets: budgets.length,
                recentTransactions: transactions.map(t => ({
                    description: t.description,
                    amount: t.amount,
                    category: t.category,
                    date: t.date
                }))
            },
            goals: goals.map(g => ({
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

        // 4. Generate Advice
        const advice = await generateStructuredAdvice(context, availableProducts, userCredentials?.googleApiKey);

        const response = NextResponse.json(advice);
        response.headers.set('X-RateLimit-Limit', limitResult.limit.toString());
        response.headers.set('X-RateLimit-Remaining', limitResult.remaining.toString());
        response.headers.set('X-RateLimit-Reset', limitResult.reset.toString());

        return response;

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error(`Advisor API Error: ${message}`);
        return NextResponse.json(
            { message: 'Failed to generate advice', error: message },
            { status: 500 }
        );
    }
}
