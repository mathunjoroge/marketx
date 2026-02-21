import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Forex Market',
    description: 'Monitor currency pairs and trade global forex markets with real-time quotes.',
};

export default function ForexLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
