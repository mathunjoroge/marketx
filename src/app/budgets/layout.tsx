import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Budgeting & Expenses',
    description: 'Track your spending, set budgets, and save more with our intuitive budgeting tools.',
};

export default function BudgetsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
