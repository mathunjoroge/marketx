'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Save, Key, Settings, Shield, AlertCircle, CheckCircle, Loader2, Globe, CreditCard, Eye, EyeOff, Lock, Database, BarChart3, Search, User } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import SecuritySettings from '@/components/settings/SecuritySettings';
import CurrencyDropdown from '@/components/CurrencyDropdown';
import styles from './settings.module.css';

export default function SettingsPage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState('account');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [userData, setUserData] = useState<{ id: string; name: string | null; email: string | null; twoFactorEnabled: boolean; image: string | null } | null>(null);

    // Settings State
    const [settings, setSettings] = useState({
        theme: 'dark',
        defaultRiskPercent: 1.0,
        currency: 'USD',
    });

    // Credentials State
    const [credentials, setCredentials] = useState({
        alpacaKeyId: '',
        alpacaSecret: '',
        fmpApiKey: '',
        finnhubApiKey: '',
        eodhdApiKey: '',
        ipinfoToken: '',
        googleApiKey: '',
        hasAlpacaSecret: false,
    });

    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

    // Load User Data
    useEffect(() => {
        async function loadData() {
            try {
                // Fetch user profile for security settings
                const userRes = await fetch('/api/user/profile');
                if (userRes.ok) {
                    const data = await userRes.json();
                    setUserData(data);
                }

                const settingsRes = await fetch('/api/user/settings');
                if (settingsRes.ok) {
                    const data = await settingsRes.json();
                    setSettings({
                        theme: data.theme || 'dark',
                        defaultRiskPercent: data.defaultRiskPercent || 1.0,
                        currency: data.currency || 'USD',
                    });
                }

                const credsRes = await fetch('/api/user/credentials');
                if (credsRes.ok) {
                    const data = await credsRes.json();
                    setCredentials({
                        alpacaKeyId: data.alpacaKeyId || '',
                        alpacaSecret: '',
                        fmpApiKey: data.fmpApiKey || '',
                        finnhubApiKey: data.finnhubApiKey || '',
                        eodhdApiKey: data.eodhdApiKey || '',
                        ipinfoToken: data.ipinfoToken || '',
                        googleApiKey: data.googleApiKey || '',
                        hasAlpacaSecret: data.hasAlpacaSecret || false,
                    });
                }
            } catch {
                // Silently fail, fields remain default
            }
        }

        if (session) {
            loadData();
        }
    }, [session]);

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/user/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (!res.ok) throw new Error('Failed to update settings');

            setSuccess('Settings saved successfully');
            setTimeout(() => setSuccess(''), 3000);
        } catch {
            setError('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCredentials = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const payload: Record<string, string> = {
                alpacaKeyId: credentials.alpacaKeyId,
                fmpApiKey: credentials.fmpApiKey,
                eodhdApiKey: credentials.eodhdApiKey,
                ipinfoToken: credentials.ipinfoToken,
                googleApiKey: credentials.googleApiKey,
            };

            if (credentials.alpacaSecret) {
                payload.alpacaSecret = credentials.alpacaSecret;
            }

            const res = await fetch('/api/user/credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Failed to update credentials');

            setSuccess('API keys saved and encrypted');
            setCredentials(prev => ({ ...prev, alpacaSecret: '', hasAlpacaSecret: !!payload.alpacaSecret || prev.hasAlpacaSecret }));
            setTimeout(() => setSuccess(''), 3000);
        } catch {
            setError('Failed to save credentials');
        } finally {
            setLoading(false);
        }
    };

    const toggleSecret = (key: string) => {
        setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const initials = session?.user?.name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U';

    interface InputFieldProps {
        label: string;
        value: string;
        onChange: (val: string) => void;
        type?: string;
        placeholder?: string;
        icon?: React.ComponentType<{ className?: string }>;
        isSecret?: boolean;
        secretKey?: string;
        hint?: string;
        accentColor?: string;
    }

    const InputField = ({
        label,
        value,
        onChange,
        placeholder = '',
        icon: Icon,
        isSecret = false,
        secretKey = '',
        hint = '',
        accentColor = 'blue',
    }: InputFieldProps) => (
        <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>
                {label}
                {isSecret && credentials.hasAlpacaSecret && secretKey === 'alpacaSecret' && (
                    <span className={styles.configuredBadge}>Configured</span>
                )}
            </label>
            <div className={styles.inputWrap}>
                <input
                    type={isSecret && !showSecrets[secretKey] ? 'password' : 'text'}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`${styles.input} ${!Icon ? styles.inputNoIcon : ''} ${isSecret ? styles.inputWithSecret : ''}`}
                    placeholder={placeholder}
                />
                {Icon && (
                    <Icon className={`${styles.inputIcon} ${accentColor === 'purple' ? styles.inputIconPurple : styles.inputIconBlue}`} />
                )}
                {isSecret && (
                    <button
                        type="button"
                        onClick={() => toggleSecret(secretKey)}
                        className={styles.eyeButton}
                        tabIndex={-1}
                        aria-label={showSecrets[secretKey] ? 'Hide secret' : 'Show secret'}
                    >
                        {showSecrets[secretKey] ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
            {hint && <p className={styles.hint}>{hint}</p>}
        </div>
    );

    const tabs = [
        { id: 'account', label: 'Account', icon: User, color: 'green' },
        { id: 'trading', label: 'Trading', icon: Settings, color: 'blue' },
        { id: 'credentials', label: 'API Keys', icon: Key, color: 'purple' },
    ];

    return (
        <AuthGuard>
            <div className={styles.container}>

                {/* Profile Header */}
                <div className={styles.profileHeader}>
                    <div className={styles.profileGlow} />
                    <div className={styles.profileInfo}>
                        <div className={styles.avatar}>{initials}</div>
                        <div>
                            <h1 className={styles.userName}>{session?.user?.name}</h1>
                            <p className={styles.userEmail}>{session?.user?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className={styles.tabSwitcher}>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
                            className={`${styles.tabButton} ${activeTab === tab.id
                                ? (tab.color === 'purple' ? styles.tabButtonActivePurple : tab.color === 'green' ? styles.tabButtonActiveGreen : styles.tabButtonActiveBlue)
                                : ''
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Feedback Messages */}
                {(success || error) && (
                    <div className={success ? styles.feedbackSuccess : styles.feedbackError}>
                        {success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        {success || error}
                    </div>
                )}

                {/* Account Tab */}
                {activeTab === 'account' && (
                    <div className={styles.cardPanel}>
                        <div className={styles.sectionHeader}>
                            <div className={`${styles.sectionIconWrap} ${styles.sectionIconGreen}`}>
                                <Shield size={20} />
                            </div>
                            <div>
                                <h2 className={styles.sectionTitle}>Account & Security</h2>
                                <p className={styles.sectionSubtitle}>Manage your account security and 2FA</p>
                            </div>
                        </div>

                        {/* Profile Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'rgba(13,17,23,0.5)', borderRadius: '0.75rem', border: '1px solid rgba(55,65,81,0.3)' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Name</span>
                                    <p style={{ color: 'white', marginTop: '0.25rem' }}>{session?.user?.name || 'Not set'}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'rgba(13,17,23,0.5)', borderRadius: '0.75rem', border: '1px solid rgba(55,65,81,0.3)' }}>
                                <div>
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Email</span>
                                    <p style={{ color: 'white', fontFamily: 'ui-monospace, monospace', marginTop: '0.25rem' }}>{session?.user?.email || 'Not set'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Security Settings */}
                        {userData && <SecuritySettings user={userData} />}
                    </div>
                )}

                {/* Trading Settings Tab */}
                {activeTab === 'trading' && (
                    <div className={styles.cardPanel}>
                        <div className={styles.sectionHeader}>
                            <div className={`${styles.sectionIconWrap} ${styles.sectionIconBlue}`}>
                                <Settings size={20} />
                            </div>
                            <div>
                                <h2 className={styles.sectionTitle}>Trading Settings</h2>
                                <p className={styles.sectionSubtitle}>Configure your trading preferences</p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveSettings} className={styles.formColumn}>
                            <div className={styles.settingsGrid}>
                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Default Risk per Trade</label>
                                    <div className={styles.inputWrap}>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0.1"
                                            max="10"
                                            value={settings.defaultRiskPercent}
                                            onChange={(e) => setSettings({ ...settings, defaultRiskPercent: parseFloat(e.target.value) })}
                                            className={styles.input}
                                        />
                                        <CreditCard className={`${styles.inputIcon} ${styles.inputIconBlue}`} />
                                        <span className={styles.unitSuffix}>%</span>
                                    </div>
                                    <p className={styles.hint}>Used to calculate position sizes automatically</p>
                                </div>

                                <div className={styles.fieldGroup}>
                                    <label className={styles.fieldLabel}>Theme</label>
                                    <div className={styles.inputWrap}>
                                        <select
                                            value={settings.theme}
                                            onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                                            className={styles.select}
                                        >
                                            <option value="dark">Dark</option>
                                            <option value="light" disabled>Light (Coming Soon)</option>
                                            <option value="system" disabled>System (Coming Soon)</option>
                                        </select>
                                        <Globe className={`${styles.inputIcon} ${styles.inputIconBlue}`} />
                                        <ChevronIcon className={styles.chevronIcon} />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.fieldGroup}>
                                <label className={styles.fieldLabel}>Base Currency</label>
                                <div className={styles.inputWrap}>
                                    <CurrencyDropdown
                                        value={settings.currency}
                                        onChange={(val) => setSettings({ ...settings, currency: val })}
                                    />
                                </div>
                            </div>

                            <div className={styles.submitWrapSettings}>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`${styles.submitButton} ${styles.submitButtonBlue}`}
                                >
                                    {loading ? <Loader2 className={styles.spinner} size={16} /> : <Save size={16} />}
                                    Save Settings
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Credentials Tab */}
                {activeTab === 'credentials' && (
                    <div className={styles.cardPanel}>
                        <div className={styles.sectionHeader}>
                            <div className={`${styles.sectionIconWrap} ${styles.sectionIconPurple}`}>
                                <Shield size={20} />
                            </div>
                            <div>
                                <h2 className={styles.sectionTitle}>API Keys</h2>
                                <p className={styles.sectionSubtitle}>Connect your broker and market data providers</p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveCredentials} className={styles.formColumnWide}>
                            {/* Alpaca Section */}
                            <div className={styles.sectionDivider}>
                                <div className={styles.dividerHeading}>
                                    <h3 className={styles.dividerTitle}>Broker — Alpaca</h3>
                                    <div className={styles.dividerLine} />
                                    {credentials.hasAlpacaSecret && (
                                        <span className={styles.connectedBadge}>
                                            <CheckCircle size={11} /> Connected
                                        </span>
                                    )}
                                </div>
                                <div className={styles.alpacaGrid}>
                                    <InputField
                                        label="API Key ID"
                                        value={credentials.alpacaKeyId}
                                        onChange={(v) => setCredentials({ ...credentials, alpacaKeyId: v })}
                                        placeholder="PKXXXXXXXXXXXXXXXX"
                                        icon={Key}
                                        accentColor="purple"
                                    />
                                    <InputField
                                        label="API Secret"
                                        value={credentials.alpacaSecret}
                                        onChange={(v) => setCredentials({ ...credentials, alpacaSecret: v })}
                                        placeholder={credentials.hasAlpacaSecret ? '••••••••••••••••' : 'Enter secret key'}
                                        icon={Lock}
                                        isSecret
                                        secretKey="alpacaSecret"
                                        accentColor="purple"
                                    />
                                </div>
                            </div>

                            {/* Market Data Section */}
                            <div className={styles.sectionDivider}>
                                <div className={styles.dividerHeading}>
                                    <h3 className={styles.dividerTitle}>Market Data Providers</h3>
                                    <div className={styles.dividerLine} />
                                </div>
                                <div className={styles.credsGrid}>
                                    <InputField
                                        label="FMP API Key"
                                        value={credentials.fmpApiKey}
                                        onChange={(v) => setCredentials({ ...credentials, fmpApiKey: v })}
                                        icon={Database}
                                        isSecret
                                        secretKey="fmp"
                                        accentColor="purple"
                                    />
                                    <InputField
                                        label="Finnhub API Key"
                                        value={credentials.finnhubApiKey}
                                        onChange={(v) => setCredentials({ ...credentials, finnhubApiKey: v })}
                                        icon={BarChart3}
                                        isSecret
                                        secretKey="finnhub"
                                        accentColor="purple"
                                    />
                                    <InputField
                                        label="EODHD API Key"
                                        value={credentials.eodhdApiKey}
                                        onChange={(v) => setCredentials({ ...credentials, eodhdApiKey: v })}
                                        icon={Database}
                                        isSecret
                                        secretKey="eodhd"
                                        accentColor="purple"
                                    />
                                    <InputField
                                        label="IPInfo Token"
                                        value={credentials.ipinfoToken}
                                        onChange={(v) => setCredentials({ ...credentials, ipinfoToken: v })}
                                        accentColor="purple"
                                    />
                                    <InputField
                                        label="Google API Key"
                                        value={credentials.googleApiKey}
                                        onChange={(v) => setCredentials({ ...credentials, googleApiKey: v })}
                                        icon={Search}
                                        isSecret
                                        secretKey="googleApiKey"
                                        accentColor="purple"
                                        hint="Used for Google Gemini and other Google Cloud services"
                                    />
                                </div>
                            </div>

                            <div className={styles.submitWrap}>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`${styles.submitButton} ${styles.submitButtonPurple}`}
                                >
                                    {loading ? <Loader2 className={styles.spinner} size={16} /> : <Save size={16} />}
                                    Save API Keys
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </AuthGuard>
    );
}

function ChevronIcon({ className }: { className?: string }) {
    return (
        <svg className={className} style={{ color: '#4b5563' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}
