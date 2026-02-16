import './globals.css';
import type { Metadata } from 'next';
import CountrySelector from '@/components/CountrySelector';
import { MarketProvider } from '@/context/MarketContext';
import AuthProvider from '@/components/auth/AuthProvider';
import { ToastProvider } from '@/components/ui/Toast';
import UserMenu from '@/components/auth/UserMenu';
import MobileNav from '@/components/MobileNav';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';
import { ThemeProvider } from '@/context/ThemeContext';
import Link from 'next/link';

export const metadata: Metadata = {
  title: {
    default: 'MarketX — Professional Trading Platform',
    template: '%s | MarketX',
  },
  description: 'Real-time market insights, portfolio management, and intelligent trading with Stacked Edge™ analytics.',
  keywords: ['trading', 'stocks', 'crypto', 'forex', 'portfolio', 'market analysis'],
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
                  <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800/50 bg-[#0d1117]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0d1117]/60">
                    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                      <div className="flex items-center gap-2 md:gap-8">
                        <MobileNav />
                        <Link href="/" style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          textDecoration: 'none'
                        }}>
                          <div style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            borderRadius: '0.75rem',
                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.4), 0 2px 4px -1px rgba(79, 70, 229, 0.2)',
                            border: '1px solid rgba(124, 58, 237, 0.3)'
                          }}>
                            <span style={{
                              color: 'white',
                              fontWeight: 800,
                              fontSize: '0.875rem',
                              letterSpacing: '-0.025em',
                              fontFamily: 'Inter, sans-serif'
                            }}>MX</span>
                          </div>

                          <span className="logo-text" style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: 'white',
                            letterSpacing: '0.05em',
                            fontFamily: 'Inter, sans-serif',
                            background: 'linear-gradient(to right, #ffffff, #9ca3af)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}>
                            MARKETX
                          </span>
                        </Link>


                        <>
                          <style>{`
        .nav-link:hover {
            color: white;
            background-color: rgba(255,255,255,0.05);
        }
        .nav-link {
            transition: all 0.2s;
        }
        @media (min-width: 768px) {
            .nav-container {
                display: flex !important;
            }
        }
    `}</style>
                          <nav
                            className="nav-container"
                            style={{
                              display: 'none',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            {[
                              { name: 'Dashboard', path: '/' },
                              { name: 'Markets', path: '/market' },
                              { name: 'Portfolio', path: '/portfolio' },
                              { name: 'Watchlist', path: '/watchlist' },
                              { name: 'Analytics', path: '/analytics' },
                            ].map((link) => (
                              <Link
                                key={link.path}
                                href={link.path}
                                className="nav-link"
                                style={{
                                  paddingLeft: '1rem',
                                  paddingRight: '1rem',
                                  paddingTop: '0.5rem',
                                  paddingBottom: '0.5rem',
                                  fontSize: '0.875rem',
                                  fontWeight: 500,
                                  color: '#9ca3af',
                                  borderRadius: '0.5rem'
                                }}
                              >
                                {link.name}
                              </Link>
                            ))}
                          </nav>
                        </>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <style>{`
                        .logo-text {
                          display: none;
                        }
                        .header-separator {
                          display: none;
                        }
                        @media (min-width: 768px) {
                          .logo-text {
                            display: block;
                          }
                          .header-separator {
                            display: block;
                          }
                          .header-right {
                            gap: 1rem !important;
                          }
                        }
                      `}</style>
                        <div className="header-country-selector">
                          <CountrySelector />
                        </div>
                        <div className="header-separator" style={{ height: '1.5rem', width: '1px', backgroundColor: 'rgba(55,65,81,0.5)', margin: '0 0.5rem' }}></div>
                        <ThemeToggle />
                        <NotificationBell />
                        <UserMenu />
                      </div>
                    </div>
                  </header>
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
