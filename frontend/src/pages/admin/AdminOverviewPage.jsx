import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  Star, 
  ShieldCheck, 
  TrendingUp, 
  ArrowUpRight, 
  Clock,
  Building,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { adminService } from '../../services/api';

export default function AdminOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getStats(days);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load admin platform stats:', err);
      setError(err.message || 'Failed to fetch platform metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [days]);

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div className="spinner spinner-primary" style={{ width: '36px', height: '36px' }} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="card text-center" style={{ padding: '3rem', maxWidth: '500px', margin: '2rem auto' }}>
        <AlertCircle size={40} style={{ color: 'var(--danger)', margin: '0 auto 1rem auto' }} />
        <h3 style={{ marginBottom: '0.5rem' }}>Failed to Load Admin Stats</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error}</p>
        <button onClick={fetchStats} className="btn btn-primary" style={{ margin: '0 auto' }}>
          <RefreshCw size={15} style={{ marginRight: '6px' }} /> Retry
        </button>
      </div>
    );
  }

  const { metrics = {}, charts = {}, recent_users = [], recent_forms = [], recent_responses = [] } = data || {};
  const timeline = charts.timeline || [];
  const maxDayCount = Math.max(...timeline.map(t => t.count), 1);
  const ratingDist = charts.rating_distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const totalRated = metrics.total_rated_responses || 1;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            Platform Control Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Real-time aggregate data, user activity, and customer responses across all registered tenant businesses.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="input-select"
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', width: 'auto' }}
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {/* Total Business Users */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Business Users
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {metrics.total_business_users ?? metrics.total_users ?? 0}
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Registered business accounts • <strong style={{ color: '#1B906F' }}>{metrics.admin_users || 1}</strong> admin
          </div>
        </div>

        {/* Total Forms */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Forms
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <FileText size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {metrics.total_forms || 0}
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Active feedback forms across all tenants
          </div>
        </div>

        {/* Average Rating */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Platform Rating
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308' }}>
              <Star size={20} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {metrics.average_rating ? metrics.average_rating.toFixed(1) : 'N/A'}
            </span>
            {metrics.average_rating && (
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>/ 5.0</span>
            )}
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Based on {metrics.total_rated_responses || 0} customer reviews
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Activity Timeline Bar Visualizer */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                Customer Submission Activity
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Daily feedback responses received platform-wide
              </p>
            </div>
            <TrendingUp size={18} style={{ color: '#1B906F' }} />
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '4px',
            height: '160px',
            paddingTop: '20px',
            borderBottom: '1px solid var(--border-color)',
            overflowX: 'auto'
          }}>
            {timeline.length > 0 ? (
              timeline.map((point, idx) => {
                const heightPct = Math.max((point.count / maxDayCount) * 100, 4);
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      minWidth: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end'
                    }}
                    title={`${point.label}: ${point.count} submissions`}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: `${heightPct}%`,
                        background: point.count > 0 ? 'linear-gradient(180deg, #1B906F 0%, #0284c7 100%)' : 'var(--border-color)',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                    />
                  </div>
                );
              })
            ) : (
              <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-secondary)', alignSelf: 'center' }}>
                No activity data recorded in this period.
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            <span>{timeline[0]?.label || 'Start'}</span>
            <span>Total: {metrics.total_responses || 0} submissions</span>
            <span>{timeline[timeline.length - 1]?.label || 'Today'}</span>
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                Star Rating Breakdown
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Platform sentiment distribution from 1 to 5 stars
              </p>
            </div>
            <Star size={18} style={{ color: '#eab308' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDist[star] || 0;
              const pct = totalRated > 0 ? Math.round((count / totalRated) * 100) : 0;
              return (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ width: '60px', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                    <span>{star}</span>
                    <Star size={13} style={{ fill: '#eab308', color: '#eab308' }} />
                  </div>
                  <div style={{ flex: 1, height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: star >= 4 ? '#10b981' : star === 3 ? '#f59e0b' : '#ef4444',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                  <div style={{ width: '70px', textAlign: 'right', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {count} ({pct}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Tables Grid: Recent Users & Recent Submissions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
        {/* Recent Registered Users */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Registered Accounts
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Recently registered organizations & workspace owners
              </p>
            </div>
            <Link to="/admin/users" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
              <span>Manage All</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>User / Organization</th>
                  <th>Role</th>
                  <th>Forms</th>
                  <th>Submissions</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recent_users.length > 0 ? (
                  recent_users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <Link to={`/admin/users/${u.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                          <div style={{ fontWeight: 600, color: '#1B906F' }}>{u.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {u.organization_name ? `${u.organization_name} • ` : ''}{u.email}
                          </div>
                        </Link>
                      </td>
                      <td>
                        <span style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: 600,
                          background: u.role === 'admin' ? 'rgba(27, 144, 111, 0.15)' : 'var(--bg-secondary)',
                          color: u.role === 'admin' ? '#1B906F' : 'var(--text-secondary)'
                        }}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{u.forms_count}</td>
                      <td style={{ fontWeight: 600 }}>{u.submissions_count}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{u.created_at}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Submissions Platform-Wide */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Latest Customer Feedback
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Real-time feedback responses arriving across all forms
              </p>
            </div>
            <Link to="/admin/responses" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
              <span>View All</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Form & Business</th>
                  <th>Rating</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent_responses.length > 0 ? (
                  recent_responses.map((sub) => (
                    <tr key={sub.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{sub.customer_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{sub.customer_email || 'No email provided'}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{sub.form_title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{sub.organization}</div>
                      </td>
                      <td>
                        {sub.rating ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 700, color: '#eab308' }}>
                            <span>{sub.rating}</span>
                            <Star size={13} style={{ fill: '#eab308' }} />
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>No rating</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{sub.created_at}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                      No customer submissions received yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
