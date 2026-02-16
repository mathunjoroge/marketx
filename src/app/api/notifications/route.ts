import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

// GET /api/notifications — get user's notifications
export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const unreadOnly = searchParams.get('unread') === 'true';

    const where = {
        userId: session.user.id,
        ...(unreadOnly ? { read: false } : {}),
    };

    const [notifications, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
        }),
        prisma.notification.count({ where: { userId: session.user.id, read: false } }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
}

// PATCH /api/notifications — mark notifications as read
export async function PATCH(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { ids, all } = await request.json();

        if (all) {
            await prisma.notification.updateMany({
                where: { userId: session.user.id, read: false },
                data: { read: true },
            });
        } else if (Array.isArray(ids) && ids.length > 0) {
            await prisma.notification.updateMany({
                where: { id: { in: ids }, userId: session.user.id },
                data: { read: true },
            });
        } else {
            return NextResponse.json({ message: 'Provide ids array or all: true' }, { status: 400 });
        }

        const unreadCount = await prisma.notification.count({
            where: { userId: session.user.id, read: false },
        });

        return NextResponse.json({ success: true, unreadCount });
    } catch {
        return NextResponse.json({ message: 'Failed to update notifications' }, { status: 500 });
    }
}
