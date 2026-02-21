import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Your Watchlists',
    description: 'Keep track of your favorite assets and monitor price movements in real-time.',
};

export default function WatchlistLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
