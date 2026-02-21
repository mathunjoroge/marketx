import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Financial Advisor',
    description: 'Get personalized financial advice and investment suggestions powered by Gemini AI.',
};

export default function AdvisorLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
