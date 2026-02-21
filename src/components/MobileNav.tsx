'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CountrySelector from '@/components/CountrySelector';
import {
  Menu,
  X,
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  Star,
  BarChart3,
  Shield,
  Wallet,
  Sparkles,
} from 'lucide-react';

const navLinks = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Markets', path: '/market', icon: TrendingUp },
  { name: 'Portfolio', path: '/portfolio', icon: Briefcase },
  { name: 'Watchlist', path: '/watchlist', icon: Star },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Finance', path: '/finance', icon: Wallet },
  { name: 'AI Advisor', path: '/advisor', icon: Sparkles },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();

  const isAdmin = ['SUPER_ADMIN', 'MARKET_ADMIN', 'COMPLIANCE_OFFICER', 'SUPPORT_AGENT'].includes(session?.user?.role ?? '');

  const allLinks = [
    ...navLinks,
    ...(isAdmin ? [{ name: 'Admin', path: '/admin', icon: Shield }] : []),
  ];

  // Close on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  return (
    <div className="mobile-nav-wrapper" ref={menuRef}>
      <style>{`
        .mobile-nav-wrapper {
          display: none;
        }
        @media (max-width: 767px) {
          .mobile-nav-wrapper {
            display: block;
          }
        }
        .mobile-hamburger {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 0.5rem;
          border: 1px solid transparent;
          background: transparent;
          color: #9ca3af;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mobile-hamburger:hover,
        .mobile-hamburger:focus-visible {
          background-color: rgba(255,255,255,0.05);
          color: white;
          border-color: rgba(107,114,128,0.4);
        }
        .mobile-hamburger:active {
          transform: scale(0.95);
        }
        .mobile-overlay {
          position: fixed;
          inset: 0;
          top: 4rem;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(4px);
          z-index: 40;
          animation: overlay-fade-in 0.2s ease-out;
        }
        @keyframes overlay-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .mobile-menu {
          position: fixed;
          top: 4rem;
          left: 0;
          right: 0;
          z-index: 50;
          background: rgba(13, 17, 23, 0.98);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(107,114,128,0.2);
          padding: 0.75rem;
          animation: menu-slide-down 0.25s ease-out;
          max-height: calc(100vh - 4rem);
          overflow-y: auto;
        }
        @keyframes menu-slide-down {
          from {
            opacity: 0;
            transform: translateY(-0.5rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .mobile-nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border-radius: 0.75rem;
          color: #9ca3af;
          font-size: 0.9375rem;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.15s;
          border: 1px solid transparent;
        }
        .mobile-nav-link:hover {
          background-color: rgba(255,255,255,0.05);
          color: white;
        }
        .mobile-nav-link:active {
          transform: scale(0.98);
        }
        .mobile-nav-link.active {
          background: linear-gradient(135deg, rgba(79,70,229,0.15), rgba(124,58,237,0.1));
          color: #a78bfa;
          border-color: rgba(124,58,237,0.2);
        }
        .mobile-nav-link .icon-wrapper {
          width: 2rem;
          height: 2rem;
          border-radius: 0.5rem;
          background: rgba(31,41,55,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .mobile-nav-link.active .icon-wrapper {
          background: rgba(79,70,229,0.2);
        }
        .mobile-nav-link:hover .icon-wrapper {
          background: rgba(55,65,81,0.6);
        }
      `}</style>

      <button
        className="mobile-hamburger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isOpen && (
        <>
          <div className="mobile-overlay" onClick={() => setIsOpen(false)} />
          <div className="mobile-menu">
            <nav>
              {allLinks.map((link) => {
                const isActive = pathname === link.path ||
                  (link.path !== '/' && pathname.startsWith(link.path));
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="icon-wrapper">
                      <Icon size={16} />
                    </div>
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(107,114,128,0.2)', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Region</span>
                <CountrySelector />
              </div>

              {status === 'unauthenticated' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'center',
                      padding: '0.75rem',
                      borderRadius: '0.75rem',
                      backgroundColor: 'rgba(55,65,81,0.4)',
                      color: 'white',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      border: '1px solid rgba(107,114,128,0.2)'
                    }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'center',
                      padding: '0.75rem',
                      borderRadius: '0.75rem',
                      background: 'linear-gradient(to right, #2563eb, #4f46e5)',
                      color: 'white',
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      boxShadow: '0 4px 6px -1px rgba(37,99,235,0.2)'
                    }}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
