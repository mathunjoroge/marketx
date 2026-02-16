'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const { status } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (status === 'unauthenticated') {
            const publicPaths = ['/login', '/register', '/'];
            if (!publicPaths.includes(pathname)) {
                router.push('/login');
            }
        }
    }, [status, pathname, router]);

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0d1117]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return <>{children}</>;
}
