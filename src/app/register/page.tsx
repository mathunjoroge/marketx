'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, AlertCircle, Loader2, Eye, EyeOff, ArrowRight, TrendingUp, BarChart3, Shield } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            const result = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                router.push('/login');
            } else {
                router.push('/portfolio');
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred. Please try again.');
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const passwordStrength = formData.password.length === 0
        ? 0
        : formData.password.length < 8
            ? 1
            : formData.password.length < 12
                ? 2
                : 3;

    const strengthLabels = ['', 'Weak', 'Good', 'Strong'];
    const strengthColors = ['', '#ef4444', '#eab308', '#22c55e'];

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
                .group:focus-within .name-icon {
                    color: #60a5fa;
                }
                .group:focus-within .email-icon {
                    color: #60a5fa;
                }
                .group:focus-within .password-icon {
                    color: #60a5fa;
                }
                .group:focus-within .confirm-icon {
                    color: #60a5fa;
                }
                .custom-button:hover {
                    background: linear-gradient(to right, #3b82f6, #6366f1);
                    box-shadow: 0 10px 15px -3px rgba(99,102,241,0.3), 0 4px 6px -2px rgba(99,102,241,0.05);
                }
                .custom-button:active {
                    transform: scale(0.98);
                }
                .custom-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                .forgot-link:hover {
                    color: #a5b4fc;
                }
                .create-link:hover {
                    color: #a5b4fc;
                }
                .eye-button:hover {
                    color: #9ca3af;
                }
                @media (min-width: 1024px) {
                    .left-panel {
                        display: flex !important;
                    }
                    .mobile-logo {
                        display: none !important;
                    }
                    .form-padding {
                        padding: 2.5rem !important;
                    }
                    .right-padding {
                        padding: 3rem !important;
                    }
                }
            `}</style>
            <div style={{
                minHeight: 'calc(100vh - 4rem)',
                display: 'flex',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#0d1117'
            }}>
                {/* Background Effects */}
                <div style={{
                    position: 'absolute',
                    top: '0',
                    right: '25%',
                    width: '600px',
                    height: '600px',
                    backgroundColor: 'rgba(79, 70, 229, 0.08)',
                    borderRadius: '9999px',
                    filter: 'blur(150px)',
                    pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '25%',
                    width: '600px',
                    height: '600px',
                    backgroundColor: 'rgba(37, 99, 235, 0.08)',
                    borderRadius: '9999px',
                    filter: 'blur(150px)',
                    pointerEvents: 'none'
                }} />

                {/* Left Panel — Branding (hidden on mobile) */}
                <div className="left-panel" style={{
                    display: 'none',
                    flex: '1',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3rem',
                    position: 'relative'
                }}>
                    <div style={{ maxWidth: '28rem' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginBottom: '2rem'
                        }}>
                            <div style={{
                                width: '2.5rem',
                                height: '2.5rem',
                                borderRadius: '0.75rem',
                                background: 'linear-gradient(to bottom right, #2563eb, #4f46e5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '1.125rem',
                                boxShadow: '0 10px 15px -3px rgba(59,130,246,0.2), 0 4px 6px -2px rgba(59,130,246,0.05)'
                            }}>
                                M
                            </div>
                            <span style={{
                                fontSize: '1.25rem',
                                fontWeight: 'bold',
                                color: 'white'
                            }}>MarketX</span>
                        </div>

                        <h1 style={{
                            fontSize: '2.25rem',
                            fontWeight: 'bold',
                            color: 'white',
                            lineHeight: '1.25',
                            marginBottom: '1rem'
                        }}>
                            Start Trading
                            <br />
                            <span style={{
                                background: 'linear-gradient(to right, #60a5fa, #818cf8)',
                                backgroundClip: 'text',
                                color: 'transparent'
                            }}>
                                Like a Pro.
                            </span>
                        </h1>
                        <p style={{
                            color: '#9ca3af',
                            fontSize: '1.125rem',
                            lineHeight: '1.75',
                            marginBottom: '2.5rem'
                        }}>
                            Join thousands of traders using MarketX for intelligent portfolio management and real-time market insights.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {[
                                { icon: TrendingUp, label: 'Real-time market data & analytics' },
                                { icon: BarChart3, label: 'Advanced portfolio tracking' },
                                { icon: Shield, label: 'Secure broker integration' },
                            ].map((feature, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem'
                                }}>
                                    <div style={{
                                        width: '2.25rem',
                                        height: '2.25rem',
                                        borderRadius: '0.5rem',
                                        backgroundColor: 'rgba(99,102,241,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <feature.icon style={{ width: '1.125rem', height: '1.125rem', color: '#818cf8' }} />
                                    </div>
                                    <span style={{
                                        color: '#d1d5db',
                                        fontSize: '0.875rem',
                                        fontWeight: '500'
                                    }}>{feature.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Panel — Form */}
                <div className="right-padding" style={{
                    flex: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem'
                }}>
                    <div style={{ width: '100%', maxWidth: '26.25rem' }}>
                        <div className="form-padding" style={{
                            backgroundColor: 'rgba(22,27,34,0.9)',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(31,41,55,0.6)',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)',
                            borderRadius: '1rem',
                            padding: '2rem'
                        }}>
                            <div style={{
                                textAlign: 'center',
                                marginBottom: '2rem'
                            }}>
                                <div className="mobile-logo" style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '3rem',
                                    height: '3rem',
                                    borderRadius: '0.75rem',
                                    background: 'linear-gradient(to bottom right, #2563eb, #4f46e5)',
                                    boxShadow: '0 10px 15px -3px rgba(59,130,246,0.2), 0 4px 6px -2px rgba(59,130,246,0.05)',
                                    marginBottom: '1.25rem'
                                }}>
                                    <span style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 'bold',
                                        color: 'white'
                                    }}>M</span>
                                </div>
                                <h2 style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    color: 'white',
                                    marginBottom: '0.375rem'
                                }}>Create your account</h2>
                                <p style={{
                                    color: '#6b7280',
                                    fontSize: '0.875rem'
                                }}>Get started with MarketX in seconds</p>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {error && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.625rem',
                                        padding: '0.875rem',
                                        fontSize: '0.875rem',
                                        color: '#f87171',
                                        backgroundColor: 'rgba(239,68,68,0.08)',
                                        border: '1px solid rgba(239,68,68,0.2)',
                                        borderRadius: '0.75rem'
                                    }}>
                                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                                        {error}
                                    </div>
                                )}

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {/* Name */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            color: '#9ca3af',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            marginLeft: '0.125rem'
                                        }}>
                                            Full Name
                                        </label>
                                        <div className="group" style={{ position: 'relative' }}>
                                            <input
                                                name="name"
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="custom-input"
                                                style={{
                                                    width: '100%',
                                                    backgroundColor: '#0d1117',
                                                    borderWidth: '1px',
                                                    borderStyle: 'solid',
                                                    borderColor: 'rgba(55,65,81,0.6)',
                                                    borderRadius: '0.75rem',
                                                    padding: '0.875rem 2.75rem 0.875rem 2.75rem',
                                                    color: 'white',
                                                    fontSize: '0.875rem',
                                                    transition: 'all 0.2s',
                                                    outline: 'none',
                                                    boxSizing: 'border-box'
                                                }}
                                                placeholder="John Doe"
                                            />
                                            <User className="name-icon" style={{
                                                position: 'absolute',
                                                left: '0.875rem',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                height: '1.125rem',
                                                width: '1.125rem',
                                                color: '#4b5563',
                                                transition: 'color 0.2s'
                                            }} />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            color: '#9ca3af',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            marginLeft: '0.125rem'
                                        }}>
                                            Email
                                        </label>
                                        <div className="group" style={{ position: 'relative' }}>
                                            <input
                                                name="email"
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="custom-input"
                                                style={{
                                                    width: '100%',
                                                    backgroundColor: '#0d1117',
                                                    borderWidth: '1px',
                                                    borderStyle: 'solid',
                                                    borderColor: 'rgba(55,65,81,0.6)',
                                                    borderRadius: '0.75rem',
                                                    padding: '0.875rem 2.75rem 0.875rem 2.75rem',
                                                    color: 'white',
                                                    fontSize: '0.875rem',
                                                    transition: 'all 0.2s',
                                                    outline: 'none',
                                                    boxSizing: 'border-box'
                                                }}
                                                placeholder="name@example.com"
                                            />
                                            <Mail className="email-icon" style={{
                                                position: 'absolute',
                                                left: '0.875rem',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                height: '1.125rem',
                                                width: '1.125rem',
                                                color: '#4b5563',
                                                transition: 'color 0.2s'
                                            }} />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            color: '#9ca3af',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            marginLeft: '0.125rem'
                                        }}>
                                            Password
                                        </label>
                                        <div className="group" style={{ position: 'relative' }}>
                                            <input
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                minLength={8}
                                                value={formData.password}
                                                onChange={handleChange}
                                                className="custom-input"
                                                style={{
                                                    width: '100%',
                                                    backgroundColor: '#0d1117',
                                                    borderWidth: '1px',
                                                    borderStyle: 'solid',
                                                    borderColor: 'rgba(55,65,81,0.6)',
                                                    borderRadius: '0.75rem',
                                                    padding: '0.875rem 2.75rem 0.875rem 2.75rem',
                                                    color: 'white',
                                                    fontSize: '0.875rem',
                                                    transition: 'all 0.2s',
                                                    outline: 'none',
                                                    boxSizing: 'border-box'
                                                }}
                                                placeholder="Minimum 8 characters"
                                            />
                                            <Lock className="password-icon" style={{
                                                position: 'absolute',
                                                left: '0.875rem',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                height: '1.125rem',
                                                width: '1.125rem',
                                                color: '#4b5563',
                                                transition: 'color 0.2s'
                                            }} />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
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
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {formData.password.length > 0 && (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                marginTop: '0.375rem'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    gap: '0.25rem',
                                                    flex: '1'
                                                }}>
                                                    {[1, 2, 3].map((level) => (
                                                        <div
                                                            key={level}
                                                            style={{
                                                                height: '0.25rem',
                                                                flex: '1',
                                                                borderRadius: '9999px',
                                                                transition: 'colors 0.2s',
                                                                backgroundColor: passwordStrength >= level ? strengthColors[passwordStrength] : '#1f2937'
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                <span style={{
                                                    fontSize: '0.6875rem',
                                                    color: '#6b7280'
                                                }}>{strengthLabels[passwordStrength]}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Confirm Password */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label style={{
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            color: '#9ca3af',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            marginLeft: '0.125rem'
                                        }}>
                                            Confirm Password
                                        </label>
                                        <div className="group" style={{ position: 'relative' }}>
                                            <input
                                                name="confirmPassword"
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                minLength={8}
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                className="custom-input"
                                                style={{
                                                    width: '100%',
                                                    backgroundColor: '#0d1117',
                                                    borderWidth: '1px',
                                                    borderStyle: 'solid',
                                                    borderColor: formData.confirmPassword && formData.confirmPassword !== formData.password ? 'rgba(239,68,68,0.5)' : 'rgba(55,65,81,0.6)',
                                                    borderRadius: '0.75rem',
                                                    padding: '0.875rem 2.75rem 0.875rem 2.75rem',
                                                    color: 'white',
                                                    fontSize: '0.875rem',
                                                    transition: 'all 0.2s',
                                                    outline: 'none',
                                                    boxSizing: 'border-box'
                                                }}
                                                placeholder="Re-enter your password"
                                            />
                                            <Lock className="confirm-icon" style={{
                                                position: 'absolute',
                                                left: '0.875rem',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                height: '1.125rem',
                                                width: '1.125rem',
                                                color: '#4b5563',
                                                transition: 'color 0.2s'
                                            }} />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="custom-button"
                                    style={{
                                        width: '100%',
                                        background: 'linear-gradient(to right, #2563eb, #4f46e5)',
                                        color: 'white',
                                        fontWeight: '600',
                                        padding: '0.875rem',
                                        borderRadius: '0.75rem',
                                        boxShadow: '0 10px 15px -3px rgba(37,99,235,0.2), 0 4px 6px -2px rgba(37,99,235,0.05)',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        fontSize: '0.875rem',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 style={{ height: '1rem', width: '1rem', animation: 'spin 1s linear infinite' }} />
                                            Creating account...
                                        </>
                                    ) : (
                                        <>
                                            <span>Create Account</span>
                                            <ArrowRight style={{ height: '1rem', width: '1rem' }} />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div style={{
                                marginTop: '2rem',
                                paddingTop: '1.5rem',
                                borderTop: '1px solid rgba(31,41,55,0.5)',
                                textAlign: 'center'
                            }}>
                                <p style={{
                                    color: 'white',
                                    fontSize: '0.875rem'
                                }}>
                                    Already have an account?{' '}
                                    <Link href="/login" className="create-link" style={{
                                        color: '#60a5fa',
                                        fontWeight: '600',
                                        transition: 'color 0.2s'
                                    }}>
                                        Sign in
                                    </Link>
                                </p>
                                                        <p style={{
                            textAlign: 'center',
                            fontSize: '1rem',
                            color: 'white',
                            marginTop: '1.5rem'
                        }}>
                            By creating an account, you agree to our Terms of Service and Privacy Policy.
                        </p>
                            </div>
                        </div>


                    </div>
                </div>
            </div>
        </>
    );
}