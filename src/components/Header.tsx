'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import MobileNav from '@/components/MobileNav';
import CountrySelector from '@/components/CountrySelector';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationBell from '@/components/NotificationBell';
import UserMenu from '@/components/auth/UserMenu';

export default function Header() {
    const pathname = usePathname();
    const { status } = useSession();

    const navLinks = [
        { name: 'Dashboard', path: '/' },
        { name: 'Markets', path: '/market' },
        { name: 'Portfolio', path: '/portfolio' },
        { name: 'Watchlist', path: '/watchlist' },
        { name: 'Analytics', path: '/analytics' },
        { name: 'Finance', path: '/finance' },
        { name: 'Budgets', path: '/budgets' },
        { name: 'Advisor', path: '/advisor' },
        { name: 'Pricing', path: '/pricing' },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-800/50 bg-[#0d1117]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0d1117]/60">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-8">
                    <MobileNav />
                    <Link href="/" aria-label="MarketX Home" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        textDecoration: 'none'
                    }}>
                        <div role="img" aria-label="MX Logo" style={{
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
                        <style jsx>{`
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
                            {navLinks.map((link) => (
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
                                        color: pathname === link.path ? 'white' : '#9ca3af',
                                        backgroundColor: pathname === link.path ? 'rgba(255,255,255,0.1)' : 'transparent',
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
                    <style jsx>{`
            .logo-text {
              display: none;
            }
            .header-separator {
              display: none;
            }
            .header-country-selector {
                display: none;
            }
            @media (min-width: 768px) {
              .logo-text {
                display: block;
              }
              .header-separator {
                display: block;
              }
              .header-country-selector {
                display: block;
              }
              .header-right {
                gap: 1rem !important;
              }
            }
            .sign-in-link:hover {
                color: white;
                background-color: rgba(255,255,255,0.05);
            }
            .get-started-button:hover {
                background: linear-gradient(to right, #3b82f6, #6366f1);
                box-shadow: 0 10px 15px -3px rgba(99,102,241,0.3), 0 4px 6px -2px rgba(99,102,241,0.05);
            }
            .get-started-button:active {
                transform: scale(0.98);
            }
          `}</style>
                    <div className="header-country-selector">
                        <CountrySelector />
                    </div>
                    <div className="header-separator" style={{ height: '1.5rem', width: '1px', backgroundColor: 'rgba(55,65,81,0.5)', margin: '0 0.5rem' }}></div>
                    <ThemeToggle />
                    <NotificationBell />

                    {status === 'loading' ? (
                        <div className="h-9 w-9 bg-gray-800 rounded-xl animate-pulse"></div>
                    ) : status === 'unauthenticated' ? (
                        <>

                            <Link
                                href="/login"
                                className="sign-in-link hidden md:block" // Hidden on mobile to save space, or can be kept
                                style={{
                                    color: 'white',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    paddingLeft: '0.75rem',
                                    paddingRight: '0.75rem',
                                    paddingTop: '0.5rem',
                                    paddingBottom: '0.5rem',
                                    borderRadius: '0.5rem',
                                    transition: 'all 0.2s',
                                    textDecoration: 'none'
                                }}
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/register"
                                className="get-started-button hidden md:block"
                                style={{
                                    background: 'linear-gradient(to right, #2563eb, #4f46e5)',
                                    color: 'white',
                                    paddingLeft: '1rem',
                                    paddingRight: '1rem',
                                    paddingTop: '0.5rem',
                                    paddingBottom: '0.5rem',
                                    borderRadius: '0.75rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    transition: 'all 0.2s',
                                    boxShadow: '0 10px 15px -3px rgba(37,99,235,0.2), 0 4px 6px -2px rgba(37,99,235,0.05)',
                                    textDecoration: 'none'
                                }}
                            >
                                Get Started
                            </Link>
                        </>
                    ) : (
                        <UserMenu />
                    )}
                </div>
            </div>
        </header >
    );
}
