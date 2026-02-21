'use client';

import styles from './pricing.module.css';
import { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';

interface PlanFeature {
    text: string;
    included: boolean;
}

interface Plan {
    name: string;
    price: string;
    period: string;
    tagline: string;
    features: PlanFeature[];
    featured?: boolean;
    ctaLabel: string;
    tier: string;
}

const PLANS: Plan[] = [
    {
        name: 'Free',
        price: '$0',
        period: '',
        tagline: 'Get started with essential market tools',
        tier: 'FREE',
        ctaLabel: 'Current Plan',
        features: [
            { text: '3 AI advisor calls per day', included: true },
            { text: '1 watchlist', included: true },
            { text: 'Basic market data', included: true },
            { text: 'Portfolio tracking', included: true },
            { text: 'Budget & goal management', included: true },
            { text: 'Advanced analytics', included: false },
            { text: 'Premium financial reports', included: false },
            { text: 'Priority AI responses', included: false },
        ],
    },
    {
        name: 'Premium',
        price: '$9.99',
        period: '/mo',
        tagline: 'Unlock deeper insights and more AI power',
        tier: 'PREMIUM',
        featured: true,
        ctaLabel: 'Upgrade to Premium',
        features: [
            { text: '20 AI advisor calls per day', included: true },
            { text: '5 watchlists', included: true },
            { text: 'Real-time market data', included: true },
            { text: 'Portfolio tracking', included: true },
            { text: 'Budget & goal management', included: true },
            { text: 'Advanced analytics dashboard', included: true },
            { text: 'Premium financial reports', included: false },
            { text: 'Priority AI responses', included: false },
        ],
    },
    {
        name: 'Pro',
        price: '$29.99',
        period: '/mo',
        tagline: 'Everything, unlimited — for serious traders',
        tier: 'PRO',
        ctaLabel: 'Upgrade to Pro',
        features: [
            { text: 'Unlimited AI advisor calls', included: true },
            { text: 'Unlimited watchlists', included: true },
            { text: 'Real-time market data', included: true },
            { text: 'Portfolio tracking', included: true },
            { text: 'Budget & goal management', included: true },
            { text: 'Advanced analytics dashboard', included: true },
            { text: 'Premium financial reports (Tax, Net Worth)', included: true },
            { text: 'Priority AI responses', included: true },
        ],
    },
];

export default function PricingPage() {
    const { info, success, error } = useToast();
    const [loading, setLoading] = useState(false);
    const [currentTier, setCurrentTier] = useState<string>('FREE');

    useEffect(() => {
        // Fetch current subscription tier
        fetch('/api/user/profile')
            .then(res => res.json())
            .then(data => {
                if (data.subscriptionTier) {
                    setCurrentTier(data.subscriptionTier);
                }
            })
            .catch(() => { });

        // Handle Stripe redirect params
        const params = new URLSearchParams(window.location.search);
        if (params.get('success')) {
            const plan = params.get('plan') || 'Premium';
            success(`Successfully upgraded to ${plan}! Your new features are now active. 🚀`);
            window.history.replaceState(null, '', '/pricing');
        }
        if (params.get('canceled')) {
            info('Checkout canceled. No charges were made.');
            window.history.replaceState(null, '', '/pricing');
        }
    }, [success, info]);

    const handleAction = async (planTier: string) => {
        setLoading(true);
        try {
            // Check if we need to manage or upgrade
            if (currentTier !== 'FREE' && planTier === currentTier) {
                // Manage subscription via portal
                const res = await fetch('/api/stripe/portal', { method: 'POST' });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
                else throw new Error(data.message || 'Failed to connect to billing portal');
            } else {
                // Checkout new plan
                const res = await fetch('/api/stripe/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan: planTier }),
                });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
                else throw new Error(data.message || 'Checkout failed');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
            error(errorMessage);
            setLoading(false);
        }
    };

    const getBtnProps = (planTier: string, isFeatured: boolean = false) => {
        if (loading) return { text: 'Loading...', className: styles.ctaSecondary, disabled: true };

        if (currentTier === planTier) {
            return { text: 'Manage Plan', className: styles.ctaCurrent, disabled: false };
        }

        if (currentTier === 'PRO' && planTier === 'PREMIUM') {
            return { text: 'Downgrade to Premium', className: styles.ctaSecondary, disabled: false };
        }

        return {
            text: `Upgrade to ${planTier === 'PRO' ? 'Pro' : 'Premium'}`,
            className: isFeatured ? styles.ctaPrimary : styles.ctaSecondary,
            disabled: false
        };
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Choose Your Plan</h1>
                <p className={styles.subtitle}>
                    From casual investors to professional traders — pick the plan that fits your ambitions.
                </p>
            </div>

            <div className={styles.grid}>
                {PLANS.map((plan) => {
                    const btn = getBtnProps(plan.tier, plan.featured);

                    return (
                        <div
                            key={plan.tier}
                            className={`${styles.card} ${plan.featured ? styles.featured : ''}`}
                        >
                            {plan.featured && (
                                <span className={styles.badge}>Most Popular</span>
                            )}

                            <p className={styles.tierName}>{plan.name}</p>

                            <div className={styles.priceRow}>
                                <span className={styles.price}>{plan.price}</span>
                                {plan.period && (
                                    <span className={styles.period}>{plan.period}</span>
                                )}
                            </div>

                            <p className={styles.tagline}>{plan.tagline}</p>

                            <ul className={styles.features}>
                                {plan.features.map((f, i) => (
                                    <li key={i} className={f.included ? '' : styles.disabledFeature}>
                                        {f.included ? (
                                            <Check className={styles.checkIcon} />
                                        ) : (
                                            <X className={styles.crossIcon} />
                                        )}
                                        {f.text}
                                    </li>
                                ))}
                            </ul>

                            {plan.tier === 'FREE' ? (
                                <button className={styles.ctaCurrent} disabled>
                                    {currentTier === 'FREE' ? '✓ Current Plan' : 'Free Plan'}
                                </button>
                            ) : (
                                <button
                                    className={btn.className}
                                    onClick={() => handleAction(plan.tier)}
                                    disabled={btn.disabled}
                                >
                                    {btn.text}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className={styles.footer}>
                <p>All plans include a 14-day free trial. Cancel anytime.</p>
                <p>
                    Questions? <Link href="/advisor">Ask our AI advisor</Link> or contact support.
                </p>
            </div>
        </div>
    );
}
