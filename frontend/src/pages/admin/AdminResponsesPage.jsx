import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Search, 
  Star, 
  Trash2, 
  Eye, 
  Download, 
  RefreshCw, 
  Building, 
  Calendar, 
  Mail, 
  User, 
  CheckCircle,
  X,
  FileText
} from 'lucide-react';
import { adminService } from '../../services/api';

export default function AdminResponsesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const formIdParam = searchParams.get('form_id') || '';

  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResponses, setTotalResponses] = useState(0);

  // Modals
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, response: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bannerMessage, setBannerMessage] = useState(null);

  const fetchResponses = async () => {
    setLoading(true);
    try {
      const res = await adminService.getResponses({
        search: search.trim() || undefined,
        rating: ratingFilter || undefined,
        form_id: formIdParam || undefined,
        page,
      });
      setResponses(res.data.data || []);
      setTotalPages(res.data.last_page || 1);
      setTotalResponses(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load global responses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, [page, ratingFilter, formIdParam]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchResponses();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.response) return;
    setDeleteLoading(true);
    try {
      await adminService.deleteResponse(deleteModal.response.id);
      setBannerMessage(`Customer response #${deleteModal.response.id} was permanently deleted.`);
      setDeleteModal({ open: false, response: null });
      fetchResponses();
    } catch (err) {
      alert(err.message || 'Failed to delete response.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!responses.length) {
      alert('No responses available to export.');
      return;
    }

    const headers = ['ID', 'Customer Name', 'Customer Email', 'Organization', 'Form Title', 'Rating', 'Feedback Summary', 'Date'];
    const rows = responses.map(r => [
      r.id,
      `"${(r.customer_name || '').replace(/"/g, '""')}"`,
      `"${(r.customer_email || '').replace(/"/g, '""')}"`,
      `"${(r.organization_name || '').replace(/"/g, '""')}"`,
      `"${(r.form_title || '').replace(/"/g, '""')}"`,
      r.rating || '',
      `"${(r.summary_preview || '').replace(/"/g, '""')}"`,
      `"${r.created_at}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `platform_feedback_responses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.75rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            Customer Submissions
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Comprehensive feed of all customer responses collected across all tenant feedback forms.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleExportCSV}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button 
            onClick={fetchResponses}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {bannerMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid #10b981',
          color: '#10b981',
          marginBottom: '1.5rem',
          fontSize: '0.9rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} />
            <span>{bannerMessage}</span>
          </div>
          <button 
            onClick={() => setBannerMessage(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px', minWidth: 0, position: 'relative' }}>
            <Search size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search by customer name, email, feedback, or form title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-text"
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>

          <div style={{ width: '160px', flex: '1 1 130px', minWidth: 0 }}>
            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setPage(1);
              }}
              className="input-select"
              style={{ width: '100%' }}
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars ★★★★★</option>
              <option value="4">4 Stars ★★★★☆</option>
              <option value="3">3 Stars ★★★☆☆</option>
              <option value="2">2 Stars ★★☆☆☆</option>
              <option value="1">1 Star ★☆☆☆☆</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.25rem' }}>
            Filter
          </button>

          {(search || ratingFilter || formIdParam) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setRatingFilter('');
                setSearchParams({});
                setPage(1);
              }}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Showing {responses.length} of {totalResponses} platform customer responses
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Customer</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Organization & Form</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Rating</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Feedback Snippet</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Date</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner spinner-primary" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : responses.length > 0 ? (
                responses.map((sub) => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {/* Customer */}
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {sub.customer_name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {sub.customer_email || 'No email provided'}
                      </div>
                    </td>

                    {/* Organization & Form */}
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {sub.form_title}
                      </div>
                      {sub.user_id ? (
                        <Link
                          to={`/admin/users/${sub.user_id}`}
                          style={{ fontSize: '0.78rem', color: '#1B906F', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', fontWeight: 500 }}
                          title="View user details, forms, and responses"
                        >
                          <Building size={12} style={{ color: 'var(--text-secondary)' }} />
                          <span>{sub.organization_name} {sub.owner_name ? `• ${sub.owner_name}` : ''}</span>
                        </Link>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Building size={12} />
                          <span>{sub.organization_name}</span>
                        </div>
                      )}
                    </td>

                    {/* Rating */}
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {sub.rating ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 700, color: '#eab308' }}>
                          <span>{sub.rating}</span>
                          <Star size={13} style={{ fill: '#eab308' }} />
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>

                    {/* Feedback Preview */}
                    <td style={{ padding: '1rem', maxWidth: '280px' }}>
                      <div style={{
                        color: 'var(--text-primary)',
                        fontSize: '0.85rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {sub.summary_preview}
                      </div>
                    </td>

                    {/* Date */}
                    <td style={{ padding: '1rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      <div>{sub.created_at}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{sub.created_at_relative}</div>
                    </td>

                    {/* Actions: View and Delete */}
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedResponse(sub)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteModal({ open: true, response: sub })}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.35rem 0.5rem' }}
                          title="Delete response"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No customer responses matching criteria found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1.25rem',
            borderTop: '1px solid var(--border-color)'
          }}>
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="btn btn-secondary btn-sm"
            >
              Previous
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="btn btn-secondary btn-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* View Detailed Response Modal */}
      {selectedResponse && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '580px', width: '100%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  Customer Submission #{selectedResponse.id}
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Form: <strong>{selectedResponse.form_title}</strong> ({selectedResponse.organization_name})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Submitter Details Card */}
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem',
              fontSize: '0.85rem'
            }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>CUSTOMER NAME</span>
                <strong>{selectedResponse.customer_name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>EMAIL ADDRESS</span>
                <strong>{selectedResponse.customer_email || 'Not provided'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>SUBMISSION DATE</span>
                <strong>{selectedResponse.created_at}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem' }}>OVERALL RATING</span>
                {selectedResponse.rating ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#eab308', fontWeight: 700 }}>
                    <span>{selectedResponse.rating} / 5</span>
                    <Star size={14} style={{ fill: '#eab308' }} />
                  </div>
                ) : (
                  <strong>No Rating</strong>
                )}
              </div>
            </div>

            {/* Feedback Content */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Feedback Comments
              </h4>
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1rem',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap'
              }}>
                {selectedResponse.summary_preview}
              </div>
            </div>

            {/* Custom Answers If Available */}
            {selectedResponse.answers && typeof selectedResponse.answers === 'object' && Object.keys(selectedResponse.answers).length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Section Responses
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {Object.entries(selectedResponse.answers).map(([key, val]) => (
                    <div key={key} style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <strong style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '2px', fontSize: '0.78rem' }}>
                        {key}:
                      </strong>
                      <span>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.response && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '1.75rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--danger-bg)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              <Trash2 size={24} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Delete Customer Response?
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete response #{deleteModal.response.id} submitted by{' '}
              <strong>{deleteModal.response.customer_name}</strong>? This action cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, response: null })}
                disabled={deleteLoading}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="btn btn-danger"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete Response'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
