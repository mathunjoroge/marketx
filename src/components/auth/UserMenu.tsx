'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { User, Settings, LogOut, ChevronDown, BarChart3, Briefcase, Shield } from 'lucide-react';

export default function UserMenu() {
    const { data: session, status } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (status === 'loading') {
        return <div className="h-9 w-9 bg-gray-800 rounded-xl animate-pulse"></div>;
    }

    if (status === 'unauthenticated') {
        return (
            <>
                <style>{`
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
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                    }}
                >
                    <Link
                        href="/login"
                        className="sign-in-link"
                        style={{
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: '700',
                            paddingLeft: '0.75rem',
                            paddingRight: '0.75rem',
                            paddingTop: '0.5rem',
                            paddingBottom: '0.5rem',
                            borderRadius: '0.5rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        Sign In
                    </Link>
                    <Link
                        href="/register"
                        className="get-started-button"
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
                            boxShadow: '0 10px 15px -3px rgba(37,99,235,0.2), 0 4px 6px -2px rgba(37,99,235,0.05)'
                        }}
                    >
                        Get Started
                    </Link>
                </div>
            </>
        );
    }

    const initials = session?.user?.name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U';

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2.5 px-2 py-1.5 rounded-xl transition-all duration-200 border ${isOpen
                    ? 'bg-gray-800/80 border-gray-700/60'
                    : 'hover:bg-gray-800/50 border-transparent hover:border-gray-700/40'
                    }`}
            >
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-500/20">
                    {initials}
                </div>
                <span className="text-sm font-medium hidden md:block text-gray-200 max-w-[120px] truncate">
                    {session?.user?.name || 'User'}
                </span>
                <ChevronDown
                    size={14}
                    className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <>
                    <style>{`
                        .user-menu-dropdown {
                            position: absolute;
                            right: 0;
                            margin-top: 0.5rem;
                            width: 16rem;
                            max-width: calc(100vw - 2rem);
                            z-index: 50;
                            overflow: hidden;
                            background: #1c2129;
                            border: 1px solid #3d444d;
                            border-radius: 0.75rem;
                            box-shadow: 0 8px 30px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06);
                        }
                        @media (max-width: 480px) {
                            .user-menu-dropdown {
                                position: fixed;
                                right: 0.5rem;
                                top: 4rem;
                                margin-top: 0;
                            }
                        }
                    `}</style>
                    <div
                        className="user-menu-dropdown"
                        style={{ animation: 'menu-fade-in 0.15s ease-out' }}
                    >
                        {/* User info */}
                        <div className="px-4 py-4 border-b border-gray-800/60">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                                    {initials}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-white truncate">{session?.user?.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation */}
                        <div
                            style={{
                                paddingTop: '0.375rem',
                                paddingBottom: '0.375rem',
                                paddingLeft: '0.375rem',
                                fontSize: '1rem',
                                paddingRight: '0.375rem'
                            }}
                        >
                            {[
                                { href: '/profile', icon: User, label: 'Profile', desc: 'Account & API keys' },
                                { href: '/portfolio', icon: Briefcase, label: 'Portfolio', desc: 'Positions & orders' },
                                { href: '/analytics', icon: BarChart3, label: 'Analytics', desc: 'Performance metrics' },
                                { href: '/settings', icon: Settings, label: 'Settings', desc: 'Preferences' },
                                ...(['SUPER_ADMIN', 'MARKET_ADMIN', 'COMPLIANCE_OFFICER', 'SUPPORT_AGENT'].includes((session?.user as any)?.role) ? [
                                    { href: '/admin', icon: Shield, label: 'Admin', desc: 'Platform management' },
                                ] : []),
                            ].map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    style={{
                                        display: 'flex',
                                        fontSize: '1rem',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        paddingLeft: '0.75rem',
                                        paddingRight: '0.75rem',
                                        paddingTop: '0.625rem',
                                        paddingBottom: '0.625rem',
                                        borderRadius: '0.5rem',
                                        color: '#d1d5db',
                                        transition: 'all 0.15s'
                                    }}
                                    onClick={() => setIsOpen(false)}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                        e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                        e.currentTarget.style.color = '#d1d5db';
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '2rem',
                                            height: '2rem',
                                            borderRadius: '0.5rem',
                                            backgroundColor: 'rgba(31,41,55,0.6)',
                                            display: 'flex',
                                            fontSize: '1rem',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.15s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(55,65,81,0.6)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'rgba(31,41,55,0.6)';
                                        }}
                                    >
                                        <item.icon
                                            size={15}
                                            style={{
                                                color: '#9ca3af',
                                                transition: 'color 0.15s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.color = 'white';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.color = '#9ca3af';
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <p style={{
                                            fontSize: '0.875rem',
                                            fontWeight: '500',
                                            lineHeight: '1',
                                        }}>{item.label}</p>
                                        <p style={{
                                            fontSize: '0.6875rem',
                                            color: '#9ca3af',
                                            lineHeight: '1',
                                            transition: 'color 0.15s'
                                        }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.color = '#6b7280';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.color = '#9ca3af';
                                            }}
                                        >{item.desc}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Sign out */}
                        <div className="border-t border-gray-800/60 py-1.5 px-1.5">
                            <button
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-red-500/8 hover:text-red-400 transition-all duration-150 group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-gray-800/60 group-hover:bg-red-500/10 flex items-center justify-center transition-colors">
                                    <LogOut size={15} className="text-gray-500 group-hover:text-red-400 transition-colors" />
                                </div>
                                <span className="text-sm font-medium">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
