'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Check, CheckCheck, X, Info, AlertTriangle, Zap, Shield } from 'lucide-react';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    data?: any;
    createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
    order_fill: { icon: Zap, color: '#10b981' },
    price_alert: { icon: AlertTriangle, color: '#f59e0b' },
    announcement: { icon: Info, color: '#3b82f6' },
    role_change: { icon: Shield, color: '#8b5cf6' },
    system: { icon: Info, color: '#6b7280' },
};

export default function NotificationBell() {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const fetchNotifications = useCallback(async () => {
        if (!session?.user) return;
        try {
            const res = await fetch('/api/notifications?limit=15');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch { }
    }, [session?.user]);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const markAllRead = async () => {
        setLoading(true);
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ all: true }),
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch { } finally {
            setLoading(false);
        }
    };

    const markRead = async (id: string) => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [id] }),
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { }
    };

    if (!session?.user) return null;

    const timeAgo = (d: string) => {
        const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
        if (s < 60) return 'just now';
        if (s < 3600) return `${Math.floor(s / 60)}m ago`;
        if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
        return `${Math.floor(s / 86400)}d ago`;
    };

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <style>{`
                .notif-bell { position: relative; display: flex; align-items: center; justify-content: center; width: 2.25rem; height: 2.25rem; border-radius: 0.5rem; border: 1px solid rgba(55,65,81,0.5); background: transparent; color: #9ca3af; cursor: pointer; transition: all 0.2s; }
                .notif-bell:hover { background: rgba(255,255,255,0.05); color: white; border-color: rgba(75,85,99,0.8); }
                .notif-badge { position: absolute; top: -2px; right: -2px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px; background: #ef4444; color: white; font-size: 0.625rem; font-weight: 700; display: flex; align-items: center; justify-content: center; border: 2px solid #0d1117; }
                .notif-panel { position: absolute; top: calc(100% + 8px); right: -8px; width: 360px; max-height: 420px; overflow-y: auto; background: #1a1f2e; border: 1px solid rgba(55,65,81,0.6); border-radius: 0.75rem; box-shadow: 0 20px 50px rgba(0,0,0,0.5); z-index: 100; }
                .notif-header { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 1px solid rgba(55,65,81,0.4); }
                .notif-item { display: flex; gap: 0.75rem; padding: 0.75rem 1rem; border-bottom: 1px solid rgba(55,65,81,0.2); cursor: pointer; transition: background 0.15s; }
                .notif-item:hover { background: rgba(255,255,255,0.03); }
                .notif-item.unread { background: rgba(59,130,246,0.05); }
                .notif-empty { padding: 2rem; text-align: center; color: #6b7280; font-size: 0.875rem; }
                @media (max-width: 480px) { .notif-panel { width: calc(100vw - 2rem); right: -60px; } }
            `}</style>

            <button className="notif-bell" onClick={() => setOpen(!open)} aria-label="Notifications">
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {open && (
                <div className="notif-panel">
                    <div className="notif-header">
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'white' }}>
                            Notifications
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    disabled={loading}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.25rem',
                                        fontSize: '0.6875rem', color: '#60a5fa', background: 'none',
                                        border: 'none', cursor: 'pointer', padding: '0.25rem 0.5rem',
                                        borderRadius: '0.25rem',
                                    }}
                                >
                                    <CheckCheck size={13} /> Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setOpen(false)}
                                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.25rem' }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {notifications.length === 0 ? (
                        <div className="notif-empty">
                            <Bell size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
                            No notifications yet
                        </div>
                    ) : (
                        notifications.map(n => {
                            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
                            const Icon = cfg.icon;
                            return (
                                <div
                                    key={n.id}
                                    className={`notif-item ${n.read ? '' : 'unread'}`}
                                    onClick={() => !n.read && markRead(n.id)}
                                >
                                    <div style={{
                                        width: 32, height: 32, borderRadius: '0.5rem',
                                        background: `${cfg.color}15`, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        <Icon size={15} style={{ color: cfg.color }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: n.read ? 400 : 600, fontSize: '0.8125rem', color: n.read ? '#9ca3af' : 'white' }}>
                                                {n.title}
                                            </span>
                                            <span style={{ fontSize: '0.625rem', color: '#6b7280', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                                {timeAgo(n.createdAt)}
                                            </span>
                                        </div>
                                        <p style={{
                                            fontSize: '0.75rem', color: '#6b7280', margin: '0.125rem 0 0', lineHeight: 1.4,
                                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                        }}>
                                            {n.message}
                                        </p>
                                    </div>
                                    {!n.read && (
                                        <div style={{
                                            width: 8, height: 8, borderRadius: '50%',
                                            background: '#3b82f6', flexShrink: 0, marginTop: 4
                                        }} />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
