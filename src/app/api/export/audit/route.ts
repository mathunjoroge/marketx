import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';

// GET /api/export/audit — export audit log as CSV (SUPER_ADMIN, COMPLIANCE_OFFICER only)
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (!user || !['SUPER_ADMIN', 'COMPLIANCE_OFFICER'].includes(user.role)) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const logs = await prisma.auditLog.findMany({
        include: {
            actor: { select: { email: true, name: true } },
            target: { select: { email: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
    });

    const headers = ['Timestamp', 'Action', 'Actor', 'Target', 'Details'];
    const rows = logs.map(l => [
        l.createdAt.toISOString(),
        l.action,
        l.actor.name || l.actor.email,
        l.target ? (l.target.name || l.target.email) : '',
        JSON.stringify(l.details || {}).replace(/,/g, ';'),
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    return new Response(csv, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="audit_log_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
    });
}
