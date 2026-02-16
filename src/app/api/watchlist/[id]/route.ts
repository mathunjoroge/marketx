import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const watchlist = await prisma.watchlist.findUnique({
            where: { id: params.id },
        });

        if (!watchlist) {
            return NextResponse.json({ error: 'Watchlist not found' }, { status: 404 });
        }

        // Verify ownership (indirectly via email look up is safer but expensive, 
        // ideally session has id, but here we trust session.user.email matches user who owns watchlist)
        // Let's do a strict check:
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user || user.id !== watchlist.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json(watchlist);
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const watchlist = await prisma.watchlist.findUnique({ where: { id: params.id } });
        if (!watchlist) return NextResponse.json({ error: 'Watchlist not found' }, { status: 404 });
        if (watchlist.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = await req.json();
        const { name, symbols } = body;

        const updated = await prisma.watchlist.update({
            where: { id: params.id },
            data: {
                name: name !== undefined ? name : undefined,
                symbols: symbols !== undefined ? symbols : undefined,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating watchlist:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const watchlist = await prisma.watchlist.findUnique({ where: { id: params.id } });
        if (!watchlist) return NextResponse.json({ error: 'Watchlist not found' }, { status: 404 });
        if (watchlist.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        await prisma.watchlist.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting watchlist:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
