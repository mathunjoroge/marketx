/**
 * Skeleton Loading Component
 * 
 * Reusable shimmer skeleton for loading states.
 * 
 * Usage:
 *   <Skeleton width="100%" height="1.5rem" />
 *   <Skeleton width="200px" height="200px" borderRadius="1rem" />
 *   <SkeletonCard />
 */

interface SkeletonProps {
    width?: string;
    height?: string;
    borderRadius?: string;
    className?: string;
}

export function Skeleton({ width = '100%', height = '1rem', borderRadius = '0.5rem', className = '' }: SkeletonProps) {
    return (
        <div
            className={className}
            style={{
                width,
                height,
                borderRadius,
                background: 'linear-gradient(90deg, #1e2530 25%, #2a3040 50%, #1e2530 75%)',
                backgroundSize: '200% 100%',
                animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
            }}
        />
    );
}

/** Pre-built card skeleton for dashboard loading states */
export function SkeletonCard() {
    return (
        <div
            style={{
                padding: '1.5rem',
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '1rem',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <Skeleton width="40%" height="1.25rem" />
                <Skeleton width="20%" height="1.25rem" />
            </div>
            <Skeleton width="60%" height="2rem" borderRadius="0.5rem" />
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <Skeleton width="30%" height="0.875rem" />
                <Skeleton width="25%" height="0.875rem" />
            </div>
        </div>
    );
}

/** Skeleton for rows/lists */
export function SkeletonRow({ count = 3 }: { count?: number }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Skeleton width="2.5rem" height="2.5rem" borderRadius="0.75rem" />
                    <div style={{ flex: 1 }}>
                        <Skeleton width="60%" height="0.875rem" />
                        <div style={{ height: '0.375rem' }} />
                        <Skeleton width="35%" height="0.75rem" />
                    </div>
                    <Skeleton width="4rem" height="1.25rem" />
                </div>
            ))}
        </div>
    );
}
