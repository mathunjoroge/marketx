import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { isAdminRole } from '@/lib/auth/roles';
import { logAuditEvent } from '@/lib/audit';

// PATCH /api/admin/users/[id]/status — suspend, ban, or reactivate a user
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const caller = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (!caller || !isAdminRole(caller.role)) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Only SUPER_ADMIN and SUPPORT_AGENT can change user status
    if (!['SUPER_ADMIN', 'SUPPORT_AGENT'].includes(caller.role)) {
        return NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 });
    }

    try {
        const { id: targetUserId } = await params;
        const { status, reason } = await request.json();

        if (!['ACTIVE', 'SUSPENDED', 'BANNED'].includes(status)) {
            return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
        }

        // SUPPORT_AGENT cannot ban, only suspend/reactivate
        if (caller.role === 'SUPPORT_AGENT' && status === 'BANNED') {
            return NextResponse.json({ message: 'Support agents cannot ban users' }, { status: 403 });
        }

        // Cannot modify your own status
        if (targetUserId === session.user.id) {
            return NextResponse.json({ message: 'Cannot change your own status' }, { status: 400 });
        }

        const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { status: true, role: true } });
        if (!target) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Cannot suspend/ban other admins unless you're SUPER_ADMIN
        if (isAdminRole(target.role) && caller.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ message: 'Cannot modify admin accounts' }, { status: 403 });
        }

        const updated = await prisma.user.update({
            where: { id: targetUserId },
            data: { status, statusReason: reason || null },
            select: { id: true, email: true, name: true, role: true, status: true, statusReason: true },
        });

        const actionMap: Record<string, string> = {
            SUSPENDED: 'USER_SUSPEND',
            BANNED: 'USER_BAN',
            ACTIVE: 'USER_REACTIVATE',
        };

        await logAuditEvent({
            actorId: session.user.id,
            action: actionMap[status],
            targetId: targetUserId,
            details: { oldStatus: target.status, newStatus: status, reason },
        });

        return NextResponse.json(updated);
    } catch (err: unknown) {
        console.error('User status update error:', err);
        return NextResponse.json({ message: 'Failed to update user status' }, { status: 500 });
    }
}
