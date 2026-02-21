import { prisma } from '@/lib/db/prisma';

/**
 * Log an admin action to the audit trail.
 */
export async function logAuditEvent({
    actorId,
    action,
    details,
    targetId,
}: {
    actorId: string;
    action: string;
    details?: unknown;
    targetId?: string;
}) {
    try {
        await prisma.auditLog.create({
            data: {
                actorId,
                action,
                details: details ?? undefined,
                targetId: targetId ?? undefined,
            },
        });
    } catch (err) {
        console.error('Failed to write audit log:', err);
    }
}
