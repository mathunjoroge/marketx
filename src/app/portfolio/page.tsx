import PortfolioDashboard from '@/components/PortfolioDashboard';
import PortfolioAnalytics from '@/components/PortfolioAnalytics';

export default function PortfolioPage() {
    return (
        <div className="space-y-8">
            <PortfolioDashboard />
            <PortfolioAnalytics />
        </div>
    );
}
