import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { isAdminRole } from '@/lib/auth/roles';

// GET /api/admin/audit — list audit log entries (SUPER_ADMIN, COMPLIANCE_OFFICER)
export async function GET(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (!user || !isAdminRole(user.role)) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    if (!['SUPER_ADMIN', 'COMPLIANCE_OFFICER'].includes(user.role)) {
        return NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const action = searchParams.get('action'); // optional filter

    const where = action ? { action } : {};

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            include: {
                actor: { select: { id: true, name: true, email: true, role: true } },
                target: { select: { id: true, name: true, email: true, role: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total, page, limit, totalPages: Math.ceil(total / limit) });
}
