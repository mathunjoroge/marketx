'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import {
    Users, BarChart3, Star, TrendingUp, Shield, ShieldCheck,
    HeadphonesIcon, Loader2, ChevronDown, Crown, FileText,
    Megaphone, PlusCircle, Trash2, Ban, UserCheck, Power, Clock
} from 'lucide-react';

const ADMIN_ROLES = ['SUPER_ADMIN', 'MARKET_ADMIN', 'COMPLIANCE_OFFICER', 'SUPPORT_AGENT', 'USER'] as const;

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ComponentType<Record<string, unknown>> }> = {
    SUPER_ADMIN: { label: 'Super Admin', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', icon: Crown },
    MARKET_ADMIN: { label: 'Market Admin', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', icon: TrendingUp },
    COMPLIANCE_OFFICER: { label: 'Compliance', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)', icon: ShieldCheck },
    SUPPORT_AGENT: { label: 'Support', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.2)', icon: HeadphonesIcon },
    USER: { label: 'User', color: '#60a5fa', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', icon: Users },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVE: { label: 'Active', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    SUSPENDED: { label: 'Suspended', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    BANNED: { label: 'Banned', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
};

interface PlatformStats {
    totalUsers: number;
    totalTrades: number;
    totalWatchlists: number;
    recentUsers: number;
}

interface UserRow {
    id: string; email: string; name: string | null; role: string;
    status: string; statusReason: string | null; createdAt: string;
    _count: { trades: number; watchlists: number };
}

interface AuditEntry {
    id: string; action: string; details: Record<string, unknown> | null; createdAt: string;
    actor: { name: string | null; email: string; role: string };
    target: { name: string | null; email: string; role: string } | null;
}

interface FeaturedAssetRow {
    id: string; symbol: string; name: string; category: string; reason: string | null;
    createdAt: string; addedBy: { name: string | null; email: string };
}

interface AnnouncementRow {
    id: string; title: string; content: string; type: string; active: boolean;
    createdAt: string; expiresAt: string | null; author: { name: string | null; email: string };
}

export default function AdminPage() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [users, setUsers] = useState<UserRow[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
    const [featuredAssets, setFeaturedAssets] = useState<FeaturedAssetRow[]>([]);
    const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [statusModal, setStatusModal] = useState<{ userId: string; action: string } | null>(null);
    const [statusReason, setStatusReason] = useState('');
    const [newAsset, setNewAsset] = useState({ symbol: '', name: '', category: 'stocks', reason: '' });
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', type: 'info' });
    const [showAddAsset, setShowAddAsset] = useState(false);
    const [showAddAnnouncement, setShowAddAnnouncement] = useState(false);

    const currentUserRole = session?.user?.role || 'USER';
    const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';
    const canSeeStats = ['SUPER_ADMIN', 'MARKET_ADMIN', 'COMPLIANCE_OFFICER'].includes(currentUserRole);
    const canSeeUsers = ['SUPER_ADMIN', 'SUPPORT_AGENT'].includes(currentUserRole);
    const canSeeAudit = ['SUPER_ADMIN', 'COMPLIANCE_OFFICER'].includes(currentUserRole);
    const canSeeMarket = ['SUPER_ADMIN', 'MARKET_ADMIN'].includes(currentUserRole);
    const canSuspend = ['SUPER_ADMIN', 'SUPPORT_AGENT'].includes(currentUserRole);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const promises: Promise<void>[] = [];

        if (canSeeStats) {
            promises.push(fetch('/api/admin/stats').then(r => r.json()).then(setStats).catch(() => { }));
        }
        if (canSeeUsers) {
            promises.push(fetch('/api/admin/users').then(r => r.json()).then(setUsers).catch(() => { }));
        }
        if (canSeeAudit) {
            promises.push(fetch('/api/admin/audit').then(r => r.json()).then(d => setAuditLogs(d.logs || [])).catch(() => { }));
        }
        if (canSeeMarket) {
            promises.push(fetch('/api/admin/assets').then(r => r.json()).then(setFeaturedAssets).catch(() => { }));
            promises.push(fetch('/api/admin/announcements').then(r => r.json()).then(setAnnouncements).catch(() => { }));
        }

        await Promise.all(promises);
        setLoading(false);
    }, [canSeeStats, canSeeUsers, canSeeAudit, canSeeMarket]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const changeRole = async (userId: string, newRole: string) => {
        setTogglingId(userId);
        setOpenDropdown(null);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole }),
            });
            if (res.ok) {
                const updated = await res.json();
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: updated.role } : u));
            }
        } finally { setTogglingId(null); }
    };

    const changeStatus = async () => {
        if (!statusModal) return;
        setTogglingId(statusModal.userId);
        try {
            const res = await fetch(`/api/admin/users/${statusModal.userId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: statusModal.action, reason: statusReason }),
            });
            if (res.ok) {
                const updated = await res.json();
                setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, status: updated.status, statusReason: updated.statusReason } : u));
            }
        } finally {
            setTogglingId(null);
            setStatusModal(null);
            setStatusReason('');
        }
    };

    const addFeaturedAsset = async () => {
        const res = await fetch('/api/admin/assets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAsset),
        });
        if (res.ok) {
            setShowAddAsset(false);
            setNewAsset({ symbol: '', name: '', category: 'stocks', reason: '' });
            fetchData();
        }
    };

    const removeFeaturedAsset = async (id: string) => {
        await fetch('/api/admin/assets', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        setFeaturedAssets(prev => prev.filter(a => a.id !== id));
    };

    const addAnnouncement = async () => {
        const res = await fetch('/api/admin/announcements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newAnnouncement),
        });
        if (res.ok) {
            setShowAddAnnouncement(false);
            setNewAnnouncement({ title: '', content: '', type: 'info' });
            fetchData();
        }
    };

    const toggleAnnouncementActive = async (id: string, active: boolean) => {
        await fetch('/api/admin/announcements', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, active }),
        });
        setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, active } : a));
    };

    const deleteAnnouncement = async (id: string) => {
        await fetch('/api/admin/announcements', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        setAnnouncements(prev => prev.filter(a => a.id !== id));
    };

    const roleCfg = ROLE_CONFIG[currentUserRole] || ROLE_CONFIG.USER;
    const RoleIcon = roleCfg.icon;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3, show: canSeeStats },
        { id: 'users', label: 'Users', icon: Users, show: canSeeUsers },
        { id: 'audit', label: 'Audit Log', icon: FileText, show: canSeeAudit },
        { id: 'market', label: 'Markets', icon: TrendingUp, show: canSeeMarket },
        { id: 'announcements', label: 'Announce', icon: Megaphone, show: canSeeMarket },
    ].filter(t => t.show);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .admin-tab { padding: 0.625rem 1rem; font-size: 0.8125rem; font-weight: 500; color: #6b7280; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; display: flex; align-items: center; gap: 0.375rem; transition: all 0.2s; white-space: nowrap; }
                .admin-tab:hover { color: #d1d5db; }
                .admin-tab.active { color: #818cf8; border-bottom-color: #818cf8; }
                .admin-card { background: #161b26; border: 1px solid rgba(55,65,81,0.4); border-radius: 0.75rem; overflow: hidden; }
                .admin-input { width: 100%; padding: 0.5rem 0.75rem; background: #0d1117; border: 1px solid rgba(55,65,81,0.6); border-radius: 0.5rem; color: white; font-size: 0.8125rem; outline: none; }
                .admin-input:focus { border-color: #6366f1; }
                .admin-btn { padding: 0.5rem 1rem; border-radius: 0.5rem; font-size: 0.8125rem; font-weight: 500; cursor: pointer; transition: all 0.2s; border: none; display: inline-flex; align-items: center; gap: 0.375rem; }
                .admin-btn-primary { background: #4f46e5; color: white; }
                .admin-btn-primary:hover { background: #4338ca; }
                .admin-btn-danger { background: rgba(239,68,68,0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
                .admin-btn-danger:hover { background: rgba(239,68,68,0.2); }
                .admin-btn-ghost { background: transparent; color: #9ca3af; border: 1px solid rgba(55,65,81,0.4); }
                .admin-btn-ghost:hover { background: rgba(255,255,255,0.05); color: white; }
                .role-dropdown { position: absolute; top: calc(100% + 4px); right: 0; background: #1e2433; border: 1px solid rgba(55,65,81,0.6); border-radius: 0.5rem; padding: 0.25rem; min-width: 180px; z-index: 50; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
                .role-option { display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.5rem 0.75rem; background: none; border: none; color: #d1d5db; font-size: 0.75rem; cursor: pointer; border-radius: 0.375rem; transition: background 0.15s; }
                .role-option:hover { background: rgba(255,255,255,0.05); }
                .role-option.active { background: rgba(99,102,241,0.1); }
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 100; }
                .modal-content { background: #1a1f2e; border: 1px solid rgba(55,65,81,0.6); border-radius: 0.75rem; padding: 1.5rem; width: 400px; max-width: 90vw; }
            `}</style>

            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: `linear-gradient(135deg, ${roleCfg.color}20, ${roleCfg.color}40)`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${roleCfg.border}` }}>
                        <RoleIcon size={18} style={{ color: roleCfg.color }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', margin: 0 }}>Admin Dashboard</h1>
                        <span style={{ fontSize: '0.75rem', color: roleCfg.color }}>{roleCfg.label}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid rgba(55,65,81,0.3)', marginBottom: '1.5rem', overflowX: 'auto' }}>
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.id} className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                            <Icon size={15} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && canSeeStats && stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {[
                        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: '#3b82f6' },
                        { label: 'Total Trades', value: stats.totalTrades, icon: BarChart3, color: '#10b981' },
                        { label: 'Watchlists', value: stats.totalWatchlists, icon: Star, color: '#f59e0b' },
                        { label: 'New Users (7d)', value: stats.recentUsers, icon: TrendingUp, color: '#8b5cf6' },
                    ].map(s => {
                        const Ic = s.icon;
                        return (
                            <div key={s.label} className="admin-card" style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem' }}>{s.label}</p>
                                        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', margin: 0 }}>{s.value}</p>
                                    </div>
                                    <div style={{ width: 36, height: 36, borderRadius: '0.5rem', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Ic size={18} style={{ color: s.color }} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && canSeeUsers && (
                <div className="admin-card">
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(55,65,81,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', margin: 0 }}>Users ({users.length})</h2>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(55,65,81,0.3)' }}>
                                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', color: '#6b7280', fontWeight: 500 }}>User</th>
                                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', color: '#6b7280', fontWeight: 500 }}>Role</th>
                                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'left', color: '#6b7280', fontWeight: 500 }}>Status</th>
                                    <th style={{ padding: '0.75rem 1.25rem', textAlign: 'center', color: '#6b7280', fontWeight: 500 }}>Trades</th>
                                    {(isSuperAdmin || canSuspend) && <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right', color: '#6b7280', fontWeight: 500 }}>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => {
                                    const rc = ROLE_CONFIG[user.role] || ROLE_CONFIG.USER;
                                    const sc = STATUS_CONFIG[user.status] || STATUS_CONFIG.ACTIVE;
                                    const Ic = rc.icon;
                                    const isMe = user.id === session?.user?.id;
                                    return (
                                        <tr key={user.id} style={{ borderBottom: '1px solid rgba(55,65,81,0.15)' }}>
                                            <td style={{ padding: '0.75rem 1.25rem' }}>
                                                <div style={{ fontWeight: 500, color: 'white' }}>{user.name || 'Unnamed'}</div>
                                                <div style={{ fontSize: '0.6875rem', color: '#6b7280' }}>{user.email}</div>
                                            </td>
                                            <td style={{ padding: '0.75rem 1.25rem' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.6875rem', fontWeight: 500, background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>
                                                    <Ic size={12} /> {rc.label}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem 1.25rem' }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.6875rem', fontWeight: 500, background: sc.bg, color: sc.color }}>
                                                    {sc.label}
                                                </span>
                                                {user.statusReason && <div style={{ fontSize: '0.625rem', color: '#6b7280', marginTop: '0.125rem' }}>{user.statusReason}</div>}
                                            </td>
                                            <td style={{ padding: '0.75rem 1.25rem', textAlign: 'center', color: '#9ca3af' }}>{user._count?.trades || 0}</td>
                                            {(isSuperAdmin || canSuspend) && (
                                                <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>
                                                    {isMe ? (
                                                        <span style={{ fontSize: '0.6875rem', color: '#4b5563' }}>You</span>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                            {/* Status actions */}
                                                            {canSuspend && user.status === 'ACTIVE' && (
                                                                <button className="admin-btn admin-btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.6875rem' }}
                                                                    onClick={() => setStatusModal({ userId: user.id, action: 'SUSPENDED' })}>
                                                                    <Ban size={12} /> Suspend
                                                                </button>
                                                            )}
                                                            {canSuspend && user.status === 'SUSPENDED' && (
                                                                <button className="admin-btn admin-btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.6875rem', color: '#10b981' }}
                                                                    onClick={() => setStatusModal({ userId: user.id, action: 'ACTIVE' })}>
                                                                    <UserCheck size={12} /> Reactivate
                                                                </button>
                                                            )}
                                                            {isSuperAdmin && user.status !== 'BANNED' && (
                                                                <button className="admin-btn admin-btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.6875rem' }}
                                                                    onClick={() => setStatusModal({ userId: user.id, action: 'BANNED' })}>
                                                                    <Ban size={12} /> Ban
                                                                </button>
                                                            )}
                                                            {isSuperAdmin && user.status === 'BANNED' && (
                                                                <button className="admin-btn admin-btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.6875rem', color: '#10b981' }}
                                                                    onClick={() => setStatusModal({ userId: user.id, action: 'ACTIVE' })}>
                                                                    <UserCheck size={12} /> Unban
                                                                </button>
                                                            )}
                                                            {/* Role change */}
                                                            {isSuperAdmin && (
                                                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                                                    <button onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                                                                        disabled={togglingId === user.id}
                                                                        className="admin-btn admin-btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.6875rem' }}>
                                                                        {togglingId === user.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <><Shield size={12} /> Role <ChevronDown size={10} /></>}
                                                                    </button>
                                                                    {openDropdown === user.id && (
                                                                        <div className="role-dropdown">
                                                                            {ADMIN_ROLES.map(r => {
                                                                                const cfg = ROLE_CONFIG[r];
                                                                                const I = cfg.icon;
                                                                                return (
                                                                                    <button key={r} className={`role-option ${user.role === r ? 'active' : ''}`}
                                                                                        onClick={() => changeRole(user.id, r)} disabled={user.role === r}
                                                                                        style={user.role === r ? { color: cfg.color } : {}}>
                                                                                        <I size={13} style={{ color: cfg.color }} /> {cfg.label}
                                                                                        {user.role === r && <span style={{ marginLeft: 'auto', fontSize: '0.625rem', color: '#6b7280' }}>current</span>}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Audit Log Tab */}
            {activeTab === 'audit' && canSeeAudit && (
                <div className="admin-card">
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(55,65,81,0.3)' }}>
                        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', margin: 0 }}>Audit Log</h2>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0' }}>Track all administrative actions</p>
                    </div>
                    {auditLogs.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                            <FileText size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                            <p>No audit events recorded yet</p>
                        </div>
                    ) : (
                        <div>
                            {auditLogs.map(log => (
                                <div key={log.id} style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(55,65,81,0.15)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '0.5rem', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <Shield size={15} style={{ color: '#818cf8' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'white' }}>{log.action.replace(/_/g, ' ')}</span>
                                                <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>
                                                    by {log.actor.name || log.actor.email}
                                                </span>
                                            </div>
                                            <span style={{ fontSize: '0.6875rem', color: '#4b5563', whiteSpace: 'nowrap' }}>
                                                <Clock size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
                                                {new Date(log.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        {log.target && (
                                            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0 0' }}>
                                                Target: {log.target.name || log.target.email}
                                            </p>
                                        )}
                                        {log.details && (
                                            <p style={{ fontSize: '0.6875rem', color: '#6b7280', margin: '0.25rem 0 0', fontFamily: 'monospace' }}>
                                                {JSON.stringify(log.details)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Market Tab — Featured Assets */}
            {activeTab === 'market' && canSeeMarket && (
                <div className="admin-card">
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(55,65,81,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', margin: 0 }}>Featured Assets</h2>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.125rem 0 0' }}>Manage highlighted market assets</p>
                        </div>
                        <button className="admin-btn admin-btn-primary" onClick={() => setShowAddAsset(!showAddAsset)}>
                            <PlusCircle size={14} /> Add Asset
                        </button>
                    </div>

                    {showAddAsset && (
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(55,65,81,0.3)', background: 'rgba(99,102,241,0.03)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <input className="admin-input" placeholder="Symbol (e.g. AAPL)" value={newAsset.symbol} onChange={e => setNewAsset({ ...newAsset, symbol: e.target.value })} />
                                <input className="admin-input" placeholder="Name (e.g. Apple Inc)" value={newAsset.name} onChange={e => setNewAsset({ ...newAsset, name: e.target.value })} />
                                <select className="admin-input" value={newAsset.category} onChange={e => setNewAsset({ ...newAsset, category: e.target.value })}>
                                    <option value="stocks">Stocks</option>
                                    <option value="crypto">Crypto</option>
                                    <option value="forex">Forex</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input className="admin-input" placeholder="Reason (optional)" value={newAsset.reason} onChange={e => setNewAsset({ ...newAsset, reason: e.target.value })} style={{ flex: 1 }} />
                                <button className="admin-btn admin-btn-primary" onClick={addFeaturedAsset} disabled={!newAsset.symbol || !newAsset.name}>Add</button>
                            </div>
                        </div>
                    )}

                    {featuredAssets.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                            <Star size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                            <p>No featured assets yet</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '0' }}>
                            {featuredAssets.map(asset => (
                                <div key={asset.id} style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(55,65,81,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span style={{ fontWeight: 600, color: 'white', marginRight: '0.5rem' }}>{asset.symbol}</span>
                                        <span style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>{asset.name}</span>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                            <span style={{ fontSize: '0.6875rem', padding: '0.125rem 0.375rem', borderRadius: '999px', background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>{asset.category}</span>
                                            {asset.reason && <span style={{ fontSize: '0.6875rem', color: '#6b7280' }}>{asset.reason}</span>}
                                        </div>
                                    </div>
                                    <button className="admin-btn admin-btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => removeFeaturedAsset(asset.id)}>
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Announcements Tab */}
            {activeTab === 'announcements' && canSeeMarket && (
                <div className="admin-card">
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(55,65,81,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', margin: 0 }}>Announcements</h2>
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.125rem 0 0' }}>Manage platform announcements</p>
                        </div>
                        <button className="admin-btn admin-btn-primary" onClick={() => setShowAddAnnouncement(!showAddAnnouncement)}>
                            <PlusCircle size={14} /> New
                        </button>
                    </div>

                    {showAddAnnouncement && (
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(55,65,81,0.3)', background: 'rgba(99,102,241,0.03)' }}>
                            <input className="admin-input" placeholder="Title" value={newAnnouncement.title}
                                onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} style={{ marginBottom: '0.5rem' }} />
                            <textarea className="admin-input" placeholder="Content" value={newAnnouncement.content} rows={3}
                                onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })} style={{ marginBottom: '0.5rem', resize: 'vertical' }} />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <select className="admin-input" value={newAnnouncement.type} style={{ width: 'auto' }}
                                    onChange={e => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}>
                                    <option value="info">Info</option>
                                    <option value="warning">Warning</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                                <button className="admin-btn admin-btn-primary" onClick={addAnnouncement} disabled={!newAnnouncement.title || !newAnnouncement.content}>Publish</button>
                            </div>
                        </div>
                    )}

                    {announcements.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                            <Megaphone size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                            <p>No announcements yet</p>
                        </div>
                    ) : (
                        <div>
                            {announcements.map(a => {
                                const typeColors: Record<string, string> = { info: '#3b82f6', warning: '#f59e0b', urgent: '#ef4444' };
                                return (
                                    <div key={a.id} style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(55,65,81,0.15)', opacity: a.active ? 1 : 0.5 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: typeColors[a.type] || '#6b7280' }} />
                                                    <span style={{ fontWeight: 600, color: 'white', fontSize: '0.875rem' }}>{a.title}</span>
                                                    {!a.active && <span style={{ fontSize: '0.625rem', padding: '0.125rem 0.375rem', borderRadius: '999px', background: 'rgba(107,114,128,0.2)', color: '#6b7280' }}>Inactive</span>}
                                                </div>
                                                <p style={{ fontSize: '0.8125rem', color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>{a.content}</p>
                                                <p style={{ fontSize: '0.6875rem', color: '#4b5563', margin: '0.375rem 0 0' }}>
                                                    {a.author.name || a.author.email} · {new Date(a.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                                                <button className="admin-btn admin-btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.6875rem' }}
                                                    onClick={() => toggleAnnouncementActive(a.id, !a.active)}>
                                                    <Power size={12} /> {a.active ? 'Disable' : 'Enable'}
                                                </button>
                                                <button className="admin-btn admin-btn-danger" style={{ padding: '0.25rem 0.5rem' }}
                                                    onClick={() => deleteAnnouncement(a.id)}>
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Status Change Modal */}
            {statusModal && (
                <div className="modal-overlay" onClick={() => setStatusModal(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 style={{ color: 'white', fontSize: '1rem', fontWeight: 600, marginTop: 0 }}>
                            {statusModal.action === 'ACTIVE' ? 'Reactivate User' : statusModal.action === 'BANNED' ? 'Ban User' : 'Suspend User'}
                        </h3>
                        <p style={{ fontSize: '0.8125rem', color: '#9ca3af', margin: '0.5rem 0 1rem' }}>
                            {statusModal.action === 'ACTIVE'
                                ? 'This will restore the user\'s access to the platform.'
                                : `This will ${statusModal.action === 'BANNED' ? 'permanently ban' : 'temporarily suspend'} the user. They won't be able to log in.`}
                        </p>
                        {statusModal.action !== 'ACTIVE' && (
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '0.375rem' }}>Reason</label>
                                <input className="admin-input" placeholder="Enter reason..." value={statusReason} onChange={e => setStatusReason(e.target.value)} />
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button className="admin-btn admin-btn-ghost" onClick={() => setStatusModal(null)}>Cancel</button>
                            <button className={`admin-btn ${statusModal.action === 'ACTIVE' ? 'admin-btn-primary' : 'admin-btn-danger'}`}
                                onClick={changeStatus} disabled={togglingId !== null}>
                                {togglingId ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
