import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Market Overview',
    description: 'Explore global markets including stocks, crypto, and forex with real-time data.',
};

export default function MarketLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
