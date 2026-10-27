import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  Download,
  Star,
  ExternalLink,
  Eye,
  Calendar,
  User,
  Mail,
  CheckCircle2,
  X,
  Layers,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { dashboardService } from '../../services/api';

export default function ResponsesPage() {
  const { id: routeFormId } = useParams();
  const [responses, setResponses] = useState([]);
  const [formsList, setFormsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedFormId, setSelectedFormId] = useState(routeFormId || '');
  const [selectedRating, setSelectedRating] = useState('');

  useEffect(() => {
    if (routeFormId) {
      setSelectedFormId(routeFormId);
    }
  }, [routeFormId]);

  // Load forms dropdown list
  useEffect(() => {
    const loadForms = async () => {
      try {
        const res = await dashboardService.getForms();
        setFormsList(res.data.data || res.data || []);
      } catch (err) {
        console.error('Failed to load forms list', err);
      }
    };
    loadForms();
  }, []);

  // Load responses based on filters
  const loadResponses = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedFormId) params.form_id = selectedFormId;
      if (selectedRating) params.rating = selectedRating;

      const res = await dashboardService.getResponses(params);
      setResponses(res.data.data || res.data || []);
    } catch (err) {
      console.error('Failed to load responses', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteResponse = async (id, customerName) => {
    const name = customerName || 'this response';
    if (!window.confirm(`Are you sure you want to delete the feedback from "${name}"?`)) {
      return;
    }

    try {
      await dashboardService.deleteResponse(id);
      if (selectedResponse && selectedResponse.id === id) {
        setSelectedResponse(null);
      }
      loadResponses();
    } catch (err) {
      console.error(err);
      alert('Failed to delete response. Please try again.');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadResponses();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedFormId, selectedRating]);

  // CSV Export handler
  const handleExportCSV = () => {
    if (responses.length === 0) return;

    const headers = ['ID', 'Customer Name', 'Customer Email', 'Form Title', 'Rating', 'Summary Preview', 'Submitted At'];
    const rows = responses.map((r) => [
      r.id,
      `"${(r.customer_name || 'Anonymous').replace(/"/g, '""')}"`,
      `"${(r.customer_email || '').replace(/"/g, '""')}"`,
      `"${(r.form_title || '').replace(/"/g, '""')}"`,
      r.rating || '',
      `"${(r.summary_preview || '').replace(/"/g, '""')}"`,
      `"${r.created_at || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `feedback_responses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="dashboard-page-container">
        {/* Header Row */}
        <div className="table-header-row dashboard-page-header">
          <div className="dashboard-page-title-block">
            <h2 className="dashboard-page-title">Customer Responses</h2>
            <p className="dashboard-page-subtitle">Browse, filter, and inspect incoming feedback submitted by customers</p>
          </div>
          <div className="table-header-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleExportCSV}
              disabled={responses.length === 0}
              title="Download responses as CSV spreadsheet"
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters Card */}
        <div className="card dashboard-table-card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '16px', alignItems: 'center' }}>
            {/* Search Input */}
            <div className="form-input-wrapper" style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search by customer name, email, or response..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter by Form */}
            <div>
              <select
                className="form-input"
                value={selectedFormId}
                onChange={(e) => setSelectedFormId(e.target.value)}
              >
                <option value="">All Feedback Forms</option>
                {formsList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Rating */}
            <div>
              <select
                className="form-input"
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
              >
                <option value="">All Ratings</option>
                <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                <option value="3">⭐⭐⭐ (3 Stars)</option>
                <option value="2">⭐⭐ (2 Stars)</option>
                <option value="1">⭐ (1 Star)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Responses Table Card */}
        <div className="card dashboard-table-card">
          {isLoading ? (
            <div className="table-loading-wrap">
              <div className="spinner spinner-primary" />
              <span>Loading customer responses...</span>
            </div>
          ) : responses.length === 0 ? (
            <div className="onboarding-empty-panel" style={{ padding: '48px 24px' }}>
              <div className="empty-icon-circle" style={{ margin: '0 auto 16px' }}>
                <MessageSquare size={28} color="var(--primary)" />
              </div>
              <h4>No customer responses found</h4>
              <p style={{ maxWidth: '480px', margin: '0 auto 20px' }}>
                {search || selectedFormId || selectedRating
                  ? 'No feedback responses match the current search filters. Try clearing your filters.'
                  : 'You have not received any feedback submissions yet. Publish and share your form link with customers to collect responses.'}
              </p>
              <Link to="/dashboard/forms" className="btn btn-primary">
                <span>View Feedback Forms</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Form</th>
                    <th>Rating</th>
                    <th>Response Summary</th>
                    <th>Submitted</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((r) => (
                    <tr key={r.id} className="table-data-row">
                      {/* Customer Name & Email */}
                      <td>
                        <strong>{r.customer_name}</strong>
                        {r.customer_email && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                            {r.customer_email}
                          </div>
                        )}
                      </td>

                      {/* Form Title */}
                      <td>
                        <span style={{
                          fontSize: '0.82rem',
                          background: 'var(--primary-light)',
                          color: 'var(--primary)',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 600,
                          display: 'inline-block'
                        }}>
                          {r.form_title}
                        </span>
                      </td>

                      {/* Rating Visual */}
                      <td>
                        {r.rating ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div style={{ display: 'flex', color: '#f59e0b', fontSize: '0.95rem' }}>
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} style={{ opacity: i < r.rating ? 1 : 0.25 }}>★</span>
                              ))}
                            </div>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                              ({r.rating}/5)
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>N/A</span>
                        )}
                      </td>

                      {/* Summary Preview */}
                      <td style={{ maxWidth: '320px' }}>
                        <div style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.9rem',
                          color: 'var(--text-main)'
                        }}>
                          {r.summary_preview}
                        </div>
                      </td>

                      {/* Date Submitted */}
                      <td>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {r.created_at ? r.created_at.split(' ').slice(0, 3).join(' ') : ''}
                        </span>
                      </td>

                      {/* Action */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions-cell">
                          <button
                            type="button"
                            className="action-btn"
                            title="View Full Submission"
                            onClick={() => setSelectedResponse(r)}
                          >
                            <Eye size={15} />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            className="action-btn action-btn-danger"
                            title="Delete Submission"
                            onClick={() => handleDeleteResponse(r.id, r.customer_name)}
                          >
                            <Trash2 size={15} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detailed Response Modal */}
        {selectedResponse && (
          <div className="modal-backdrop" onClick={() => setSelectedResponse(null)}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
              <div className="modal-header">
                <div>
                  <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Customer Response Details</h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
                    Form: <strong>{selectedResponse.form_title}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setSelectedResponse(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body" style={{ gap: '20px', maxHeight: '70vh', overflowY: 'auto' }}>
                {/* Meta details bar */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  background: '#f8fafc',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>
                      Customer
                    </span>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.92rem' }}>
                      {selectedResponse.customer_name}
                    </p>
                    {selectedResponse.customer_email && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {selectedResponse.customer_email}
                      </span>
                    )}
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>
                      Rating
                    </span>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.92rem', color: '#f59e0b' }}>
                      {selectedResponse.rating ? `${'★'.repeat(selectedResponse.rating)} (${selectedResponse.rating}/5)` : 'N/A'}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>
                      Submitted On
                    </span>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                      {selectedResponse.created_at ? selectedResponse.created_at.split(' ').slice(0, 3).join(' ') : ''}
                    </p>
                  </div>
                </div>

                {/* Question by question answers */}
                <div>
                  <h4 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-main)' }}>
                    Detailed Question Answers
                  </h4>

                  {selectedResponse.answers && selectedResponse.answers.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedResponse.answers.map((ans, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '14px',
                            background: '#ffffff',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                            Q{idx + 1}: {ans.question}
                          </span>
                          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 500 }}>
                            {Array.isArray(ans.answer) ? ans.answer.join(', ') : String(ans.answer)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="modal-comments-box">
                      <p style={{ margin: 0 }}>{selectedResponse.summary_preview}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ color: 'var(--danger)', borderColor: 'var(--danger)', gap: '6px' }}
                  onClick={() => handleDeleteResponse(selectedResponse.id, selectedResponse.customer_name)}
                >
                  <Trash2 size={15} />
                  <span>Delete Response</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedResponse(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
