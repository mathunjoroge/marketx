import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Cryptocurrency Market',
    description: 'Trade top cryptocurrencies with lightning-fast execution and real-time insights.',
};

export default function CryptoLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
