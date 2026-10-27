import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Star, 
  ArrowRight, 
  Eye, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  X,
  Tag
} from 'lucide-react';

export default function RecentResponsesTable({ responses = [], isLoading }) {
  const [activeModalResponse, setActiveModalResponse] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'reviewed':
        return <span className="status-pill status-reviewed">Reviewed</span>;
      case 'flagged':
        return <span className="status-pill status-flagged">Flagged</span>;
      default:
        return <span className="status-pill status-new">New</span>;
    }
  };

  return (
    <div className="card dashboard-table-card">
      <div className="table-header-row">
        <div>
          <h3 className="section-card-title">Recent Feedback Submissions</h3>
          <p className="section-card-subtitle">Real-time incoming reviews from customers</p>
        </div>

        <Link to="/dashboard/responses" className="view-all-link">
          <span>View All Responses</span>
          <ArrowRight size={15} />
        </Link>
      </div>

      {isLoading ? (
        <div className="table-loading-wrap">
          <div className="spinner spinner-primary" />
          <span>Loading feedback responses...</span>
        </div>
      ) : responses.length === 0 ? (
        <div className="table-empty-wrap">
          <div className="empty-icon-circle">
            <MessageSquare size={24} color="var(--text-dim)" />
          </div>
          <h4>No feedback responses received yet</h4>
          <p>
            When customers fill out your published forms, their ratings and answers will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Feedback Form</th>
                <th>Rating</th>
                <th>Comment Preview</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((res) => (
                <tr key={res.id} className="table-data-row">
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="user-avatar-sm" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                        {res.customer_name ? res.customer_name.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <strong className="form-title-text">{res.customer_name}</strong>
                    </div>
                  </td>

                  <td>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>
                      {res.form_title}
                    </span>
                  </td>

                  <td>
                    {res.rating !== null ? (
                      <div className="rating-stars-inline">
                        <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{res.rating}</span>
                        <Star size={14} fill="#f59e0b" color="#f59e0b" />
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>N/A</span>
                    )}
                  </td>

                  <td>
                    <div className="response-preview-text" title={res.summary_preview}>
                      {res.summary_preview}
                    </div>
                  </td>

                  <td className="table-date-cell">{res.created_at}</td>

                  <td>{getStatusBadge(res.review_status)}</td>

                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="action-btn"
                      onClick={() => setActiveModalResponse(res)}
                      title="View submission details"
                    >
                      <Eye size={14} />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Response Detail Modal */}
      {activeModalResponse && (
        <div className="modal-backdrop" onClick={() => setActiveModalResponse(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="modal-icon-badge">
                  <MessageSquare size={20} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem' }}>Response Details</h3>
                  <small style={{ color: 'var(--text-muted)' }}>ID #{activeModalResponse.id}</small>
                </div>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveModalResponse(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-field-group">
                <span className="modal-label">Form</span>
                <p className="modal-value">{activeModalResponse.form_title}</p>
              </div>

              <div className="modal-field-group">
                <span className="modal-label">Customer</span>
                <p className="modal-value">{activeModalResponse.customer_name}</p>
              </div>

              <div className="modal-field-group">
                <span className="modal-label">Rating</span>
                <div className="modal-value" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {activeModalResponse.rating ? (
                    <>
                      <strong style={{ fontSize: '1.1rem' }}>{activeModalResponse.rating} / 5</strong>
                      <Star size={16} fill="#f59e0b" color="#f59e0b" />
                    </>
                  ) : (
                    <span>No star rating provided</span>
                  )}
                </div>
              </div>

              <div className="modal-field-group">
                <span className="modal-label">Submitted On</span>
                <p className="modal-value">{activeModalResponse.created_at}</p>
              </div>

              <div className="modal-field-group">
                <span className="modal-label">Customer Comments</span>
                <div className="modal-comments-box">
                  {activeModalResponse.summary_preview}
                </div>
              </div>

              <div className="modal-field-group">
                <span className="modal-label">Current Status</span>
                <div>{getStatusBadge(activeModalResponse.review_status)}</div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveModalResponse(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
