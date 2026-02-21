import AuthGuard from '@/components/auth/AuthGuard';
import PortfolioDashboard from '@/components/PortfolioDashboard';
import PortfolioAnalytics from '@/components/PortfolioAnalytics';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function PortfolioPage() {
    return (
        <AuthGuard>
            <div className="space-y-8">
                <ErrorBoundary>
                    <PortfolioDashboard />
                </ErrorBoundary>
                <ErrorBoundary>
                    <PortfolioAnalytics />
                </ErrorBoundary>
            </div>
        </AuthGuard>
    );
}
