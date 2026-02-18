'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Save, Key, Settings, Shield, AlertCircle, CheckCircle, Loader2, Globe, CreditCard, Eye, EyeOff, Lock, Database, BarChart3, Search } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import { CURRENCIES, Currency } from '@/lib/currencies';
import CurrencyDropdown from './CurrencyDropdown';

export default function ProfilePage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState('settings');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

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
            } catch (err) {
                console.error('Failed to load user data');
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
        } catch (err) {
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
        } catch (err) {
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
        icon?: any;
        isSecret?: boolean;
        secretKey?: string;
        hint?: string;
        accentColor?: string;
    }

    const InputField = ({
        label,
        value,
        onChange,
        type = 'text',
        placeholder = '',
        icon: Icon,
        isSecret = false,
        secretKey = '',
        hint = '',
        accentColor = 'blue',
    }: InputFieldProps) => {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginLeft: '0.125rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    {label}
                    {isSecret && credentials.hasAlpacaSecret && secretKey === 'alpacaSecret' && (
                        <span style={{
                            textTransform: 'none',
                            letterSpacing: 'normal',
                            fontSize: '0.625rem',
                            color: '#34d399',
                            backgroundColor: 'rgba(52,211,153,0.1)',
                            paddingLeft: '0.375rem',
                            paddingRight: '0.375rem',
                            paddingTop: '0.125rem',
                            paddingBottom: '0.125rem',
                            borderRadius: '0.375rem',
                            fontWeight: 'bold'
                        }}>
                            Configured
                        </span>
                    )}
                </label>
                <div className="group" style={{ position: 'relative' }}>
                    <input
                        type={isSecret && !showSecrets[secretKey] ? 'password' : 'text'}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="custom-input"
                        style={{
                            width: '100%',
                            backgroundColor: '#0d1117',
                            borderWidth: '1px',
                            borderStyle: 'solid',
                            borderColor: 'rgba(55,65,81,0.6)',
                            borderRadius: '0.75rem',
                            padding: '0.875rem',
                            paddingLeft: Icon ? '2.75rem' : '1rem',
                            paddingRight: isSecret ? '2.75rem' : '1rem',
                            color: 'white',
                            fontSize: '0.875rem',
                            fontFamily: 'ui-monospace, monospace',
                            transition: 'all 0.2s',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                        placeholder={placeholder}
                    />
                    {Icon && (
                        <Icon className={`${accentColor}-icon`} style={{
                            position: 'absolute',
                            left: '0.875rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            height: '1.125rem',
                            width: '1.125rem',
                            color: '#4b5563',
                            transition: 'color 0.2s'
                        }} />
                    )}
                    {isSecret && (
                        <button
                            type="button"
                            onClick={() => toggleSecret(secretKey)}
                            className="eye-button"
                            style={{
                                position: 'absolute',
                                right: '0.75rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                padding: '0.125rem',
                                color: '#4b5563',
                                transition: 'color 0.2s',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                            tabIndex={-1}
                        >
                            {showSecrets[secretKey] ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    )}
                </div>
                {hint && <p style={{
                    fontSize: '0.6875rem',
                    color: '#4b5563',
                    marginLeft: '0.125rem'
                }}>{hint}</p>}
            </div>
        );
    };

    const tabs = [
        { id: 'settings', label: 'Settings', icon: Settings, color: 'blue' },
        { id: 'credentials', label: 'API Keys', icon: Key, color: 'purple' },
    ];

    return (
        <>
            <style>{`
                .custom-input::placeholder {
                    color: #4b5563;
                }
                .custom-input:hover {
                    border-color: #4b5563;
                }
                .custom-input:focus {
                    border-color: rgba(59,130,246,0.7);
                    box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
                }
                .group:focus-within .blue-icon {
                    color: #60a5fa;
                }
                .group:focus-within .purple-icon {
                    color: #a78bfa;
                }
                .custom-button-blue {
                    background: linear-gradient(to right, #2563eb, #4f46e5);
                    box-shadow: 0 10px 15px -3px rgba(37,99,235,0.2), 0 4px 6px -2px rgba(37,99,235,0.05);
                }
                .custom-button-blue:hover {
                    background: linear-gradient(to right, #3b82f6, #6366f1);
                    box-shadow: 0 10px 15px -3px rgba(59,130,246,0.3), 0 4px 6px -2px rgba(59,130,246,0.05);
                }
                .custom-button-purple {
                    background: linear-gradient(to right, #7c3aed, #4f46e5);
                    box-shadow: 0 10px 15px -3px rgba(124,58,237,0.2), 0 4px 6px -2px rgba(124,58,237,0.05);
                }
                .custom-button-purple:hover {
                    background: linear-gradient(to right, #8b5cf6, #6366f1);
                    box-shadow: 0 10px 15px -3px rgba(139,92,246,0.3), 0 4px 6px -2px rgba(139,92,246,0.05);
                }
                .custom-button:active {
                    transform: scale(0.98);
                }
                .custom-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .tab-button {
                    transition: all 0.2s;
                }
                .tab-button:hover {
                    color: #d1d5db;
                    background-color: rgba(255,255,255,0.05);
                }
                .eye-button:hover {
                    color: #9ca3af;
                }
                @media (min-width: 768px) {
                    .settings-grid {
                        grid-template-columns: 1fr 1fr !important;
                    }
                    .creds-grid {
                        grid-template-columns: 1fr 1fr !important;
                    }
                    .alpaca-grid {
                        grid-template-columns: 1fr 1fr !important;
                    }
                }
            `}</style>
            <AuthGuard>
                <div style={{
                    maxWidth: '100%',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    paddingTop: '1.5rem',
                    paddingBottom: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2rem'
                }}>

                    {/* Profile Header */}
                    <div style={{
                        backgroundColor: 'rgba(22,27,34,0.8)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(31,41,55,0.6)',
                        borderRadius: '1rem',
                        padding: '2rem',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: '12rem',
                            height: '12rem',
                            backgroundColor: 'rgba(37,99,235,0.05)',
                            borderRadius: '50%',
                            filter: 'blur(80px)',
                            pointerEvents: 'none'
                        }} />
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.25rem',
                            position: 'relative',
                            zIndex: 10
                        }}>
                            <div style={{
                                height: '4rem',
                                width: '4rem',
                                borderRadius: '1rem',
                                background: 'linear-gradient(to bottom right, #3b82f6, #6366f1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '1.25rem',
                                fontWeight: 'bold',
                                boxShadow: '0 10px 15px -3px rgba(59,130,246,0.2), 0 4px 6px -2px rgba(59,130,246,0.05)'
                            }}>
                                {initials}
                            </div>
                            <div>
                                <h1 style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    color: 'white'
                                }}>
                                    {session?.user?.name}
                                </h1>
                                <p style={{
                                    color: '#6b7280',
                                    fontSize: '0.875rem',
                                    fontFamily: 'ui-monospace, monospace',
                                    marginTop: '0.125rem'
                                }}>{session?.user?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div style={{
                        display: 'flex',
                        gap: '0.25rem',
                        padding: '0.25rem',
                        backgroundColor: 'rgba(22,27,34,0.6)',
                        border: '1px solid rgba(31,41,55,0.4)',
                        borderRadius: '0.75rem',
                        width: 'fit-content'
                    }}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
                                className="tab-button"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    paddingLeft: '1.25rem',
                                    paddingRight: '1.25rem',
                                    paddingTop: '0.625rem',
                                    paddingBottom: '0.625rem',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    ...(activeTab === tab.id
                                        ? {
                                            backgroundColor: tab.color === 'purple' ? '#7c3aed' : '#2563eb',
                                            color: 'white',
                                            boxShadow: tab.color === 'purple'
                                                ? '0 10px 15px -3px rgba(124,58,237,0.2), 0 4px 6px -2px rgba(124,58,237,0.05)'
                                                : '0 10px 15px -3px rgba(37,99,235,0.2), 0 4px 6px -2px rgba(37,99,235,0.05)'
                                        }
                                        : { color: '#6b7280' }
                                    )
                                }}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Feedback Messages */}
                    {(success || error) && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.625rem',
                            padding: '0.875rem',
                            borderRadius: '0.75rem',
                            fontSize: '0.875rem',
                            ...(success
                                ? {
                                    color: '#34d399',
                                    backgroundColor: 'rgba(52,211,153,0.08)',
                                    border: '1px solid rgba(52,211,153,0.2)'
                                }
                                : {
                                    color: '#f87171',
                                    backgroundColor: 'rgba(239,68,68,0.08)',
                                    border: '1px solid rgba(239,68,68,0.2)'
                                }
                            )
                        }}>
                            {success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                            {success || error}
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div style={{
                            backgroundColor: 'rgba(22,27,34,0.8)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(31,41,55,0.6)',
                            borderRadius: '1rem',
                            padding: '2rem'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '2rem',
                                paddingBottom: '1.5rem',
                                borderBottom: '1px solid rgba(31,41,55,0.4)'
                            }}>
                                <div style={{
                                    width: '2.5rem',
                                    height: '2.5rem',
                                    borderRadius: '0.75rem',
                                    backgroundColor: 'rgba(59,130,246,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Settings size={20} style={{ color: '#60a5fa' }} />
                                </div>
                                <div>
                                    <h2 style={{
                                        fontSize: '1.125rem',
                                        fontWeight: 'bold',
                                        color: 'white'
                                    }}>Trading Settings</h2>
                                    <p style={{
                                        fontSize: '0.75rem',
                                        color: '#6b7280'
                                    }}>Configure your trading preferences</p>
                                </div>
                            </div>

                            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="settings-grid" style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr',
                                    gap: '1.5rem'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            color: '#9ca3af',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            marginLeft: '0.125rem'
                                        }}>
                                            Default Risk per Trade
                                        </label>
                                        <div className="group" style={{ position: 'relative' }}>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0.1"
                                                max="10"
                                                value={settings.defaultRiskPercent}
                                                onChange={(e) => setSettings({ ...settings, defaultRiskPercent: parseFloat(e.target.value) })}
                                                className="custom-input"
                                                style={{
                                                    width: '100%',
                                                    backgroundColor: '#0d1117',
                                                    borderWidth: '1px',
                                                    borderStyle: 'solid',
                                                    borderColor: 'rgba(55,65,81,0.6)',
                                                    borderRadius: '0.75rem',
                                                    padding: '0.875rem',
                                                    paddingLeft: '2.75rem',
                                                    color: 'white',
                                                    fontSize: '0.875rem',
                                                    fontFamily: 'ui-monospace, monospace',
                                                    transition: 'all 0.2s',
                                                    outline: 'none',
                                                    boxSizing: 'border-box'
                                                }}
                                            />
                                            <CreditCard className="blue-icon" style={{
                                                position: 'absolute',
                                                left: '0.875rem',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                height: '1.125rem',
                                                width: '1.125rem',
                                                color: '#4b5563',
                                                transition: 'color 0.2s'
                                            }} />
                                            <span style={{
                                                position: 'absolute',
                                                right: '1rem',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                color: '#4b5563',
                                                fontSize: '0.875rem',
                                                fontFamily: 'ui-monospace, monospace'
                                            }}>%</span>
                                        </div>
                                        <p style={{
                                            fontSize: '0.6875rem',
                                            color: '#4b5563',
                                            marginLeft: '0.125rem'
                                        }}>
                                            Used to calculate position sizes automatically
                                        </p>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            color: '#9ca3af',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            marginLeft: '0.125rem'
                                        }}>
                                            Theme
                                        </label>
                                        <div className="group" style={{ position: 'relative' }}>
                                            <select
                                                value={settings.theme}
                                                onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    backgroundColor: '#0d1117',
                                                    borderWidth: '1px',
                                                    borderStyle: 'solid',
                                                    borderColor: 'rgba(55,65,81,0.6)',
                                                    borderRadius: '0.75rem',
                                                    padding: '0.875rem',
                                                    paddingLeft: '2.75rem',
                                                    paddingRight: '2.75rem',
                                                    color: 'white',
                                                    fontSize: '0.875rem',
                                                    transition: 'all 0.2s',
                                                    outline: 'none',
                                                    boxSizing: 'border-box',
                                                    appearance: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="dark">Dark</option>
                                                <option value="light" disabled>Light (Coming Soon)</option>
                                                <option value="system" disabled>System (Coming Soon)</option>
                                            </select>
                                            <Globe className="blue-icon" style={{
                                                position: 'absolute',
                                                left: '0.875rem',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                height: '1.125rem',
                                                width: '1.125rem',
                                                color: '#4b5563',
                                                transition: 'color 0.2s'
                                            }} />
                                            <ChevronIcon style={{
                                                position: 'absolute',
                                                right: '1rem',
                                                top: '50%',
                                                transform: 'translateY(-50%)'
                                            }} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <label style={{
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        color: '#9ca3af',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        marginLeft: '0.125rem'
                                    }}>
                                        Base Currency
                                    </label>
                                    <div className="group" style={{ position: 'relative' }}>
                                        <CurrencyDropdown
                                            value={settings.currency}
                                            onChange={(val) => setSettings({ ...settings, currency: val })}
                                        />
                                    </div>
                                </div>

                                <div style={{ paddingTop: '1rem' }}>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="custom-button custom-button-blue"
                                        style={{
                                            background: 'linear-gradient(to right, #2563eb, #4f46e5)',
                                            color: 'white',
                                            fontWeight: '600',
                                            paddingLeft: '1.5rem',
                                            paddingRight: '1.5rem',
                                            paddingTop: '0.75rem',
                                            paddingBottom: '0.75rem',
                                            borderRadius: '0.75rem',
                                            boxShadow: '0 10px 15px -3px rgba(37,99,235,0.2), 0 4px 6px -2px rgba(37,99,235,0.05)',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontSize: '0.875rem',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {loading ? <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={16} /> : <Save size={16} />}
                                        Save Settings
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Credentials Tab */}
                    {activeTab === 'credentials' && (
                        <div style={{
                            backgroundColor: 'rgba(22,27,34,0.8)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(31,41,55,0.6)',
                            borderRadius: '1rem',
                            padding: '2rem'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                marginBottom: '2rem',
                                paddingBottom: '1.5rem',
                                borderBottom: '1px solid rgba(31,41,55,0.4)'
                            }}>
                                <div style={{
                                    width: '2.5rem',
                                    height: '2.5rem',
                                    borderRadius: '0.75rem',
                                    backgroundColor: 'rgba(168,85,247,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Shield size={20} style={{ color: '#a78bfa' }} />
                                </div>
                                <div>
                                    <h2 style={{
                                        fontSize: '1.125rem',
                                        fontWeight: 'bold',
                                        color: 'white'
                                    }}>API Keys</h2>
                                    <p style={{
                                        fontSize: '0.75rem',
                                        color: '#6b7280'
                                    }}>Connect your broker and market data providers</p>
                                </div>
                            </div>

                            <form onSubmit={handleSaveCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {/* Alpaca Section */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem'
                                    }}>
                                        <h3 style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            color: '#a78bfa',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>Broker — Alpaca</h3>
                                        <div style={{
                                            height: '1px',
                                            backgroundColor: 'rgba(31,41,55,0.6)',
                                            flex: 1
                                        }} />
                                        {credentials.hasAlpacaSecret && (
                                            <span style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.375rem',
                                                paddingLeft: '0.5rem',
                                                paddingRight: '0.5rem',
                                                paddingTop: '0.25rem',
                                                paddingBottom: '0.25rem',
                                                backgroundColor: 'rgba(52,211,153,0.08)',
                                                color: '#34d399',
                                                borderRadius: '0.5rem',
                                                fontSize: '0.625rem',
                                                fontWeight: 'bold',
                                                border: '1px solid rgba(52,211,153,0.15)'
                                            }}>
                                                <CheckCircle size={11} /> Connected
                                            </span>
                                        )}
                                    </div>
                                    <div className="alpaca-grid" style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr',
                                        gap: '1.25rem'
                                    }}>
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
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem'
                                    }}>
                                        <h3 style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            color: '#a78bfa',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}>Market Data Providers</h3>
                                        <div style={{
                                            height: '1px',
                                            backgroundColor: 'rgba(31,41,55,0.6)',
                                            flex: 1
                                        }} />
                                    </div>
                                    <div className="creds-grid" style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr',
                                        gap: '1.25rem'
                                    }}>
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

                                <div style={{ paddingTop: '0.5rem' }}>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="custom-button custom-button-purple"
                                        style={{
                                            background: 'linear-gradient(to right, #7c3aed, #4f46e5)',
                                            color: 'white',
                                            fontWeight: '600',
                                            paddingLeft: '1.5rem',
                                            paddingRight: '1.5rem',
                                            paddingTop: '0.75rem',
                                            paddingBottom: '0.75rem',
                                            borderRadius: '0.75rem',
                                            boxShadow: '0 10px 15px -3px rgba(124,58,237,0.2), 0 4px 6px -2px rgba(124,58,237,0.05)',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            fontSize: '0.875rem',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {loading ? <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={16} /> : <Save size={16} />}
                                        Save API Keys
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div >
            </AuthGuard >
        </>
    );
}

function ChevronIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <svg className={className} style={{ color: '#4b5563', ...style }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}