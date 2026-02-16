import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { logAuditEvent } from '@/lib/audit';

async function requireMarketAdmin() {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
    }
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (!user || !['SUPER_ADMIN', 'MARKET_ADMIN'].includes(user.role)) {
        return { error: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) };
    }
    return { session, role: user.role };
}

// GET /api/admin/announcements — list all announcements
export async function GET() {
    const { error } = await requireMarketAdmin();
    if (error) return error;

    const announcements = await prisma.announcement.findMany({
        include: { author: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(announcements);
}

// POST /api/admin/announcements — create announcement
export async function POST(request: NextRequest) {
    const { error, session } = await requireMarketAdmin();
    if (error) return error;

    try {
        const { title, content, type, expiresAt } = await request.json();
        if (!title || !content) {
            return NextResponse.json({ message: 'title and content required' }, { status: 400 });
        }

        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                type: type || 'info',
                authorId: session!.user.id,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
            },
        });

        await logAuditEvent({
            actorId: session!.user.id,
            action: 'ANNOUNCEMENT_CREATE',
            details: { title, type },
        });

        return NextResponse.json(announcement, { status: 201 });
    } catch {
        return NextResponse.json({ message: 'Failed to create announcement' }, { status: 500 });
    }
}

// PATCH /api/admin/announcements — toggle active status
export async function PATCH(request: NextRequest) {
    const { error, session } = await requireMarketAdmin();
    if (error) return error;

    try {
        const { id, active } = await request.json();
        if (!id || typeof active !== 'boolean') {
            return NextResponse.json({ message: 'id and active required' }, { status: 400 });
        }

        const announcement = await prisma.announcement.update({
            where: { id },
            data: { active },
        });

        await logAuditEvent({
            actorId: session!.user.id,
            action: active ? 'ANNOUNCEMENT_ACTIVATE' : 'ANNOUNCEMENT_DEACTIVATE',
            details: { announcementId: id, title: announcement.title },
        });

        return NextResponse.json(announcement);
    } catch {
        return NextResponse.json({ message: 'Failed to update announcement' }, { status: 500 });
    }
}

// DELETE /api/admin/announcements — delete announcement
export async function DELETE(request: NextRequest) {
    const { error, session } = await requireMarketAdmin();
    if (error) return error;

    try {
        const { id } = await request.json();
        if (!id) return NextResponse.json({ message: 'id required' }, { status: 400 });

        const announcement = await prisma.announcement.delete({ where: { id } });

        await logAuditEvent({
            actorId: session!.user.id,
            action: 'ANNOUNCEMENT_DELETE',
            details: { title: announcement.title },
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ message: 'Failed to delete announcement' }, { status: 500 });
    }
}
