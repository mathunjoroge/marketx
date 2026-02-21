import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Stock Market',
    description: 'Real-time stock market data, charts, and analysis for professional traders.',
};

export default function StocksLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
