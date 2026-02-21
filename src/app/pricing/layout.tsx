import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Pricing',
    description: 'Compare MarketX plans — Free, Premium, and Pro. Unlock AI-powered trading insights, advanced analytics, and premium reports.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
