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

// GET /api/admin/assets — list featured assets
export async function GET() {
    const { error } = await requireMarketAdmin();
    if (error) return error;

    const assets = await prisma.featuredAsset.findMany({
        include: { addedBy: { select: { name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(assets);
}

// POST /api/admin/assets — add a featured asset
export async function POST(request: NextRequest) {
    const { error, session } = await requireMarketAdmin();
    if (error) return error;

    try {
        const { symbol, name, category, reason } = await request.json();
        if (!symbol || !name || !category) {
            return NextResponse.json({ message: 'symbol, name, and category required' }, { status: 400 });
        }

        const asset = await prisma.featuredAsset.create({
            data: { symbol: symbol.toUpperCase(), name, category, reason, addedById: session!.user.id },
        });

        await logAuditEvent({
            actorId: session!.user.id,
            action: 'ASSET_FEATURED',
            details: { symbol, name, category },
        });

        return NextResponse.json(asset, { status: 201 });
    } catch (err: unknown) {
        if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
            return NextResponse.json({ message: 'Asset already featured' }, { status: 409 });
        }
        return NextResponse.json({ message: 'Failed to add featured asset' }, { status: 500 });
    }
}

// DELETE /api/admin/assets — remove a featured asset
export async function DELETE(request: NextRequest) {
    const { error, session } = await requireMarketAdmin();
    if (error) return error;

    try {
        const { id } = await request.json();
        if (!id) return NextResponse.json({ message: 'id required' }, { status: 400 });

        const asset = await prisma.featuredAsset.delete({ where: { id } });

        await logAuditEvent({
            actorId: session!.user.id,
            action: 'ASSET_UNFEATURED',
            details: { symbol: asset.symbol },
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ message: 'Failed to remove asset' }, { status: 500 });
    }
}
