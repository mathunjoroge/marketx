import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Trading Analytics',
    description: 'Deep dive into your trading performance and identify patterns with advanced analytics.',
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
