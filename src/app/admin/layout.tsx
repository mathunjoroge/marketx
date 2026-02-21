import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Admin Dashboard',
    description: 'Platform management, user administration, and system health monitoring.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
