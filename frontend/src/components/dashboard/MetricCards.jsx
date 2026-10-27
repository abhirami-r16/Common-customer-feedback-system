import { Link } from 'react-router-dom';
import { 
  FileText, 
  MessageSquare, 
  Star, 
  ArrowUpRight 
} from 'lucide-react';

export default function MetricCards({ metrics, isLoading }) {
  if (isLoading) {
    return (
      <div className="metrics-grid">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card metric-card skeleton-card">
            <div className="skeleton-line" style={{ width: '40%', height: '14px', marginBottom: '12px' }} />
            <div className="skeleton-line" style={{ width: '60%', height: '32px', marginBottom: '14px' }} />
            <div className="skeleton-line" style={{ width: '80%', height: '12px' }} />
          </div>
        ))}
      </div>
    );
  }

  const {
    total_forms = 0,
    published_forms = 0,
    draft_forms = 0,
    total_responses = 0,
    average_rating = null,
    total_rated_responses = 0,
    response_rate = null,
    response_rate_note = 'Delivery tracking is not applicable for open public forms.',
  } = metrics || {};

  return (
    <div className="metrics-grid">
      {/* Card 1: Total Forms */}
      <div className="card metric-card">
        <div className="metric-header">
          <span className="metric-title">Total Forms</span>
          <div className="metric-icon-box" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)' }}>
            <FileText size={18} />
          </div>
        </div>
        <div className="metric-value">{total_forms}</div>
        <div className="metric-subtext">
          <span style={{ color: 'var(--success)', fontWeight: 600 }}>{published_forms} published</span>
          <span style={{ margin: '0 4px', color: 'var(--text-dim)' }}>•</span>
          <span style={{ color: 'var(--text-muted)' }}>{draft_forms} drafts</span>
        </div>
        <div className="metric-footer">
          <Link to="/dashboard/forms" className="metric-link">
            <span>Manage forms</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* Card 2: Total Responses */}
      <div className="card metric-card">
        <div className="metric-header">
          <span className="metric-title">Total Responses</span>
          <div className="metric-icon-box" style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)', color: 'var(--secondary)' }}>
            <MessageSquare size={18} />
          </div>
        </div>
        <div className="metric-value">{total_responses}</div>
        <div className="metric-subtext">
          {total_responses === 0 ? (
            <span style={{ color: 'var(--text-muted)' }}>No submissions recorded yet</span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Across all active forms</span>
          )}
        </div>
        <div className="metric-footer">
          <Link to="/dashboard/responses" className="metric-link">
            <span>View all responses</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* Card 3: Average Satisfaction Rating */}
      <div className="card metric-card">
        <div className="metric-header">
          <span className="metric-title">Avg. Customer Rating</span>
          <div className="metric-icon-box" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
            <Star size={18} />
          </div>
        </div>
        <div className="metric-value" style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          {average_rating !== null ? (
            <>
              <span>{average_rating}</span>
              <span style={{ fontSize: '1.1rem', color: 'var(--text-dim)', fontWeight: 500 }}>/ 5.0</span>
            </>
          ) : (
            <span style={{ fontSize: '1.4rem', color: 'var(--text-dim)', fontWeight: 500 }}>No ratings</span>
          )}
        </div>
        <div className="metric-subtext">
          {total_rated_responses > 0 ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star size={13} fill="#f59e0b" color="#f59e0b" />
              <span>Based on {total_rated_responses} customer ratings</span>
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Calculated once ratings are submitted</span>
          )}
        </div>
        <div className="metric-footer">
          <Link to="/dashboard/analytics" className="metric-link">
            <span>Rating breakdown</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
