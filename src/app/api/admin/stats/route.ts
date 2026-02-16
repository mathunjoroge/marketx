import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { isAdminRole, canViewStats } from '@/lib/auth/roles';

// GET /api/admin/stats — platform-wide statistics
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (!user || !isAdminRole(user.role)) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    if (!canViewStats(user.role)) {
        return NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 });
    }

    const [totalUsers, totalTrades, totalWatchlists, recentUsers] = await Promise.all([
        prisma.user.count(),
        prisma.trade.count(),
        prisma.watchlist.count(),
        prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    ]);

    return NextResponse.json({
        totalUsers,
        totalTrades,
        totalWatchlists,
        recentUsers,
    });
}
