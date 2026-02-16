
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';

export default async function AnalyticsPage() {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <AnalyticsDashboard />
        </div>
    );
}
