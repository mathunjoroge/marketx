'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';

interface UpgradeBannerProps {
    feature?: string;
    message?: string;
}

export default function UpgradeBanner({ feature, message }: UpgradeBannerProps) {
    const msg = message || `Upgrade to Premium for more ${feature || 'AI'} power.`;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '0.875rem 1.25rem',
            background: 'linear-gradient(135deg, rgba(31,111,235,0.08), rgba(162,89,255,0.08))',
            border: '1px solid rgba(31,111,235,0.2)',
            borderRadius: '0.625rem',
            marginTop: '1.5rem',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                fontSize: '0.8125rem',
                color: '#8b949e',
            }}>
                <Sparkles style={{ width: 16, height: 16, color: '#a259ff' }} />
                <span>{msg}</span>
            </div>

            <Link
                href="/pricing"
                style={{
                    padding: '0.4rem 1rem',
                    background: 'linear-gradient(135deg, #1f6feb, #a259ff)',
                    color: '#fff',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s',
                }}
            >
                View Plans
            </Link>
        </div>
    );
}
