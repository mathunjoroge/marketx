'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Smartphone, AlertTriangle, CheckCircle2, Loader2, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface User {
    twoFactorEnabled: boolean;
}

export default function SecuritySettings({ user }: { user: User }) {
    const router = useRouter();
    const [isEnabled, setIsEnabled] = useState(user.twoFactorEnabled);
    const [step, setStep] = useState<'initial' | 'setup' | 'verify'>('initial');
    const [secret, setSecret] = useState('');
    const [otpauthUrl, setOtpauthUrl] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const startSetup = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setSecret(data.secret);
            setOtpauthUrl(data.otpauthUrl);
            setStep('setup');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to start setup';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const verifyAndEnable = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/2fa/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: verificationCode }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setIsEnabled(true);
            setStep('initial');
            setSuccessMessage('Two-factor authentication enabled successfully!');
            router.refresh();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Verification failed';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const disable2FA = async () => {
        if (!confirm('Are you sure you want to disable 2FA? Your account will be less secure.')) return;

        setLoading(true);
        try {
            const res = await fetch('/api/auth/2fa/setup', { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to disable 2FA');

            setIsEnabled(false);
            setSuccessMessage('Two-factor authentication disabled.');
            router.refresh();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!'); // Replace with toast if available
    };

    return (
        <div className="card">
            <div className="flex justify-between items-start mb-6">
                <div className="flex gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Two-Factor Authentication</h3>
                        <p className="text-slate-400 text-sm mt-1">
                            Add an extra layer of security to your account using TOTP apps like Google Authenticator or Authy.
                        </p>
                    </div>
                </div>
                {isEnabled && (
                    <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-semibold border border-green-500/20">
                        ENABLED
                    </span>
                )}
            </div>

            {error && (
                <div className="p-4 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-2 text-sm">
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="p-4 mb-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 flex items-center gap-2 text-sm">
                    <CheckCircle2 size={16} />
                    {successMessage}
                </div>
            )}

            {!isEnabled && step === 'initial' && (
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Smartphone className="text-slate-400" />
                            <div>
                                <h4 className="font-semibold text-slate-200">Authenticator App</h4>
                                <p className="text-sm text-slate-500">Use an app to generate verification codes.</p>
                            </div>
                        </div>
                        <button
                            onClick={startSetup}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : 'Enable 2FA'}
                        </button>
                    </div>
                </div>
            )}

            {step === 'setup' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* QR Code Section */}
                        <div className="bg-white p-4 rounded-xl w-fit mx-auto md:mx-0">
                            <QRCodeSVG value={otpauthUrl} size={180} />
                        </div>

                        {/* Manual Entry Section */}
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-white mb-2">1. Scan QR Code</h4>
                                <p className="text-sm text-slate-400">
                                    Open your authenticator app (Google Authenticator, Authy, etc.) and scan the QR code.
                                </p>
                            </div>

                            <div className="p-3 bg-slate-900 rounded-lg border border-slate-700">
                                <p className="text-xs text-slate-500 mb-1 uppercase font-semibold">Manual Entry Key</p>
                                <div className="flex items-center justify-between text-slate-300 font-mono text-sm">
                                    <span>{secret}</span>
                                    <button
                                        onClick={() => copyToClipboard(secret)}
                                        className="p-1 hover:text-white transition-colors"
                                        title="Copy to clipboard"
                                    >
                                        <Copy size={14} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold text-white mb-2">2. Enter Verification Code</h4>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000 000"
                                        className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono tracking-widest w-40 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <button
                                        onClick={verifyAndEnable}
                                        disabled={loading || verificationCode.length !== 6}
                                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={16} /> : 'Verify & Enable'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setStep('initial')}
                        className="text-slate-500 hover:text-slate-300 text-sm"
                    >
                        Cancel Setup
                    </button>
                </div>
            )}

            {isEnabled && (
                <div className="bg-red-500/5 rounded-xl p-6 border border-red-500/10 mt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-red-400">Disable Two-Factor Authentication</h4>
                            <p className="text-sm text-red-500/70 mt-1">
                                Removes the extra layer of security from your account.
                            </p>
                        </div>
                        <button
                            onClick={disable2FA}
                            disabled={loading}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            Disable
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
