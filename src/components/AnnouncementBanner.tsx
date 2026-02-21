'use client';

import { useState, useEffect } from 'react';
import { X, AlertTriangle, Info } from 'lucide-react';

interface Announcement {
    id: string;
    title: string;
    content: string;
    type: string;
    createdAt: string;
}

const TYPE_STYLES: Record<string, { bg: string; border: string; color: string; icon: React.ElementType }> = {
    info: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', color: '#60a5fa', icon: Info },
    warning: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', color: '#fbbf24', icon: AlertTriangle },
    urgent: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', color: '#f87171', icon: AlertTriangle },
};

export default function AnnouncementBanner() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [dismissed, setDismissed] = useState<Set<string>>(() => {
        if (typeof window === 'undefined') return new Set();
        try {
            const saved = localStorage.getItem('dismissed-announcements');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch {
            return new Set();
        }
    });

    useEffect(() => {
        fetch('/api/announcements')
            .then(r => r.json())
            .then(data => setAnnouncements(Array.isArray(data) ? data : []))
            .catch(() => { });
    }, []);

    const dismiss = (id: string) => {
        const next = new Set([...dismissed, id]);
        setDismissed(next);
        localStorage.setItem('dismissed-announcements', JSON.stringify([...next]));
    };

    const visible = announcements.filter(a => !dismissed.has(a.id));
    if (visible.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {visible.map(a => {
                const style = TYPE_STYLES[a.type] || TYPE_STYLES.info;
                const Icon = style.icon;
                return (
                    <div key={a.id} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                        padding: '0.75rem 1rem', borderRadius: '0.75rem',
                        background: style.bg, border: `1px solid ${style.border}`,
                    }}>
                        <Icon size={18} style={{ color: style.color, flexShrink: 0, marginTop: 2 }} />
                        <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'white' }}>{a.title}</span>
                            <p style={{ fontSize: '0.8125rem', color: '#9ca3af', margin: '0.125rem 0 0', lineHeight: 1.4 }}>{a.content}</p>
                        </div>
                        <button onClick={() => dismiss(a.id)} style={{
                            background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0.25rem', flexShrink: 0,
                        }}><X size={16} /></button>
                    </div>
                );
            })}
        </div>
    );
}
