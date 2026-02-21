import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Financial Health',
    description: 'Analyze your income, expenses, and overall financial wellbeing with Stacked Edge™ insights.',
};

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
