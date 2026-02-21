import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Settings',
    description: 'Configure your account, security preferences, and trading settings.',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
