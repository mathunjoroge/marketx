import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { isAdminRole, canManageUsers, canManageRoles, ALL_ROLES } from '@/lib/auth/roles';
import { logAuditEvent } from '@/lib/audit';

/** Require any admin-level role. Returns session + role. */
async function requireAdmin() {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }) };
    }
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (!user || !isAdminRole(user.role)) {
        return { error: NextResponse.json({ message: 'Forbidden' }, { status: 403 }) };
    }
    return { session, role: user.role };
}

// GET /api/admin/users — list all users (SUPER_ADMIN + SUPPORT_AGENT)
export async function GET() {
    const { error, role } = await requireAdmin();
    if (error) return error;

    if (!canManageUsers(role!)) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
            statusReason: true,
            createdAt: true,
            _count: { select: { trades: true, watchlists: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
}

// PATCH /api/admin/users — update a user's role (SUPER_ADMIN only)
export async function PATCH(request: NextRequest) {
    const { error, role: callerRole, session } = await requireAdmin();
    if (error) return error;

    if (!canManageRoles(callerRole!)) {
        return NextResponse.json({ message: 'Only Super Admin can change roles' }, { status: 403 });
    }

    try {
        const { userId, role } = await request.json();

        if (!userId || !(ALL_ROLES as readonly string[]).includes(role)) {
            return NextResponse.json({ message: 'Invalid userId or role' }, { status: 400 });
        }

        const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        if (!target) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: { id: true, email: true, name: true, role: true, status: true },
        });

        await logAuditEvent({
            actorId: session!.user.id,
            action: 'ROLE_CHANGE',
            targetId: userId,
            details: { oldRole: target.role, newRole: role },
        });

        return NextResponse.json(updated);
    } catch (err: unknown) {
        console.error('Admin user update error:', err);
        return NextResponse.json({ message: 'Failed to update user' }, { status: 500 });
    }
}
