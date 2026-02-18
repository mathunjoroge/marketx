import './globals.css';
import type { Metadata, Viewport } from 'next';
import { MarketProvider } from '@/context/MarketContext';
import AuthProvider from '@/components/auth/AuthProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeProvider } from '@/context/ThemeContext';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: {
    default: 'MarketX — Professional Trading Platform',
    template: '%s | MarketX',
  },
  description: 'Real-time market insights, portfolio management, and intelligent trading with Stacked Edge™ analytics.',
  keywords: ['trading', 'stocks', 'crypto', 'forex', 'portfolio', 'market analysis'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MarketX',
  },
};

export const viewport: Viewport = {
  themeColor: '#0d1117',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <ThemeProvider>
              <MarketProvider>
                <div className="min-h-screen bg-[#0d1117] text-gray-100 flex flex-col">
                  <Header />
                  <div className="h-16"></div> {/* Spacer for fixed header */}
                  <div className="h-16"></div> {/* Spacer for fixed header */}
                  <main className="flex-1 container mx-auto px-4 py-8">
                    {children}
                  </main>
                </div>
              </MarketProvider>
            </ThemeProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
