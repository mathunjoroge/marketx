import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Portfolio Tracking',
    description: 'Manage your investments, track performance, and analyze your trading history.',
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
