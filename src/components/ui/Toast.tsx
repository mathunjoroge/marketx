'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType, duration?: number) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

const TOAST_ICONS = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
};

const TOAST_COLORS = {
    success: { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)', icon: '#4ade80' },
    error: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', icon: '#f87171' },
    info: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', icon: '#60a5fa' },
    warning: { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.3)', icon: '#fbbf24' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
        const timer = timersRef.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(id);
        }
    }, []);

    const addToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setToasts(prev => [...prev.slice(-4), { id, message, type, duration }]); // Max 5 toasts

        const timer = setTimeout(() => removeToast(id), duration);
        timersRef.current.set(id, timer);
    }, [removeToast]);

    // Cleanup on unmount
    useEffect(() => {
        const currentTimers = timersRef.current;
        return () => {
            currentTimers.forEach(timer => clearTimeout(timer));
        };
    }, []);

    const ctx: ToastContextType = {
        toast: addToast,
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        info: (msg) => addToast(msg, 'info'),
        warning: (msg) => addToast(msg, 'warning'),
    };

    return (
        <ToastContext.Provider value={ctx}>
            {children}
            {/* Toast Container */}
            <div
                style={{
                    position: 'fixed',
                    bottom: '1.5rem',
                    right: '1.5rem',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    pointerEvents: 'none',
                }}
            >
                {toasts.map((t) => {
                    const Icon = TOAST_ICONS[t.type];
                    const colors = TOAST_COLORS[t.type];
                    return (
                        <div
                            key={t.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.875rem 1rem',
                                background: colors.bg,
                                border: `1px solid ${colors.border}`,
                                borderRadius: '0.75rem',
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                minWidth: '300px',
                                maxWidth: '420px',
                                animation: 'toast-slide-in 0.3s ease-out',
                                pointerEvents: 'auto',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                            }}
                        >
                            <Icon style={{ width: '1.125rem', height: '1.125rem', color: colors.icon, flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: '0.875rem', color: '#e5e7eb', fontWeight: 500 }}>
                                {t.message}
                            </span>
                            <button
                                onClick={() => removeToast(t.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    padding: '0.25rem',
                                    display: 'flex',
                                    flexShrink: 0,
                                }}
                            >
                                <X style={{ width: '0.875rem', height: '0.875rem' }} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
