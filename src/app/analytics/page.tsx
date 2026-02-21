'use client';

import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import AuthGuard from '@/components/auth/AuthGuard';

export default function AnalyticsPage() {
    return (
        <AuthGuard>
            <div className="container mx-auto px-4 py-8">
                <AnalyticsDashboard />
            </div>
        </AuthGuard>
    );
}
