import { BarChart3, TrendingUp, Star, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="dashboard-page-container">
        <div className="table-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Analytics & Sentiment</h2>
            <p style={{ color: 'var(--text-muted)' }}>Deep dive into customer satisfaction trends and completion metrics</p>
          </div>
        </div>

        <div className="card" style={{ padding: '48px 32px', textAlign: 'center' }}>
          <div className="empty-icon-circle" style={{ margin: '0 auto 16px' }}>
            <BarChart3 size={28} color="var(--primary)" />
          </div>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>Advanced Analytics Hub</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 20px' }}>
            Full comparative historical trend charts, Net Promoter Score (NPS) breakdown, and question drop-off analysis will be featured in the Advanced Analytics milestone.
          </p>
          <Link to="/dashboard" className="btn btn-primary">
            <ArrowLeft size={16} />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
