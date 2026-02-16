/**
 * Centralized role definitions and permission helpers for MarketX.
 *
 * Role hierarchy (highest → lowest):
 *   SUPER_ADMIN  →  full platform control
 *   MARKET_ADMIN →  manage market data & assets
 *   COMPLIANCE_OFFICER → regulatory oversight, trade monitoring
 *   SUPPORT_AGENT → read-only user support
 *   USER → regular platform user
 */

export const ALL_ROLES = [
    'SUPER_ADMIN',
    'MARKET_ADMIN',
    'COMPLIANCE_OFFICER',
    'SUPPORT_AGENT',
    'USER',
] as const;

export type AppRole = (typeof ALL_ROLES)[number];

/** Roles that grant access to the /admin area */
export const ADMIN_ROLES: AppRole[] = [
    'SUPER_ADMIN',
    'MARKET_ADMIN',
    'COMPLIANCE_OFFICER',
    'SUPPORT_AGENT',
];

/** Check if a role has admin-level access (/admin page) */
export function isAdminRole(role: string | undefined | null): boolean {
    return ADMIN_ROLES.includes(role as AppRole);
}

/** Can this role manage (view) users? SUPER_ADMIN = full, SUPPORT_AGENT = read-only */
export function canManageUsers(role: string | undefined | null): boolean {
    return role === 'SUPER_ADMIN' || role === 'SUPPORT_AGENT';
}

/** Can this role change other users' roles? Only SUPER_ADMIN */
export function canManageRoles(role: string | undefined | null): boolean {
    return role === 'SUPER_ADMIN';
}

/** Can this role view platform-wide stats? */
export function canViewStats(role: string | undefined | null): boolean {
    return role === 'SUPER_ADMIN' || role === 'MARKET_ADMIN' || role === 'COMPLIANCE_OFFICER';
}

/** Can this role view all trades (compliance/audit)? */
export function canViewAllTrades(role: string | undefined | null): boolean {
    return role === 'SUPER_ADMIN' || role === 'MARKET_ADMIN' || role === 'COMPLIANCE_OFFICER';
}

/** Role display colors for badges */
export function getRoleBadgeStyle(role: string): { color: string; bg: string; border: string } {
    switch (role) {
        case 'SUPER_ADMIN':
            return { color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' };
        case 'MARKET_ADMIN':
            return { color: '#fb923c', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.2)' };
        case 'COMPLIANCE_OFFICER':
            return { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)' };
        case 'SUPPORT_AGENT':
            return { color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)' };
        default: // USER
            return { color: '#60a5fa', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' };
    }
}

/** Human-readable role label */
export function getRoleLabel(role: string): string {
    switch (role) {
        case 'SUPER_ADMIN': return 'Super Admin';
        case 'MARKET_ADMIN': return 'Market Admin';
        case 'COMPLIANCE_OFFICER': return 'Compliance';
        case 'SUPPORT_AGENT': return 'Support';
        default: return 'User';
    }
}
