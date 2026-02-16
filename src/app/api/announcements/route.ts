import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

// GET /api/announcements — public endpoint for active announcements
export async function GET() {
    const now = new Date();
    const announcements = await prisma.announcement.findMany({
        where: {
            active: true,
            OR: [
                { expiresAt: null },
                { expiresAt: { gt: now } },
            ],
        },
        select: {
            id: true, title: true, content: true, type: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
    });
    return NextResponse.json(announcements);
}
