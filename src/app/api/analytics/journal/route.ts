
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { Prisma, ExitReason } from '@prisma/client';

export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const userId = session.user.id;
        const { searchParams } = new URL(req.url); // Use standard URL object/searchParams

        const symbol = searchParams.get('symbol');
        const outcome = searchParams.get('outcome'); // 'WIN' or 'LOSS'
        const passedExitReason = searchParams.get('exitReason');
        const timeframe = searchParams.get('timeframe'); // '7D', '30D', 'YTD', 'ALL'
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        const where: Prisma.TradeWhereInput = {
            userId,
            status: 'CLOSED'
        };

        if (symbol) {
            where.symbol = { contains: symbol, mode: 'insensitive' };
        }

        if (passedExitReason) {
            where.exitReason = passedExitReason as ExitReason;
        }

        if (outcome === 'WIN') {
            where.pnl = { gt: 0 };
        } else if (outcome === 'LOSS') {
            where.pnl = { lt: 0 }; // Should this encompass 0? Usually 0 is break-even.
        }

        if (timeframe && timeframe !== 'ALL') {
            const now = new Date();
            let startDate = new Date();

            if (timeframe === '7D') startDate.setDate(now.getDate() - 7);
            if (timeframe === '30D') startDate.setDate(now.getDate() - 30);
            if (timeframe === '90D') startDate.setDate(now.getDate() - 90);
            if (timeframe === 'YTD') startDate = new Date(now.getFullYear(), 0, 1);

            where.exitTime = { gte: startDate };
        }

        const trades = await prisma.trade.findMany({
            where,
            orderBy: { exitTime: 'desc' },
            skip: offset,
            take: limit
        });

        const totalCount = await prisma.trade.count({ where });

        return NextResponse.json({
            trades,
            pagination: {
                page,
                limit,
                total: totalCount,
                pages: Math.ceil(totalCount / limit)
            }
        });

    } catch (error) {
        console.error('Journal API Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
