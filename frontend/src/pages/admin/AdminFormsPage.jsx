import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  ExternalLink, 
  Trash2, 
  Star, 
  RefreshCw, 
  Building, 
  User, 
  MessageSquare,
  Globe
} from 'lucide-react';
import { adminService } from '../../services/api';

export default function AdminFormsPage() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalForms, setTotalForms] = useState(0);
  const [deleteModal, setDeleteModal] = useState({ open: false, form: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const res = await adminService.getForms({
        search: search.trim() || undefined,
        page,
      });
      setForms(res.data.data || []);
      setTotalPages(res.data.last_page || 1);
      setTotalForms(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load platform forms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchForms();
  };

  const handleDeleteForm = async () => {
    if (!deleteModal.form) return;
    setDeleteLoading(true);
    try {
      await adminService.deleteForm(deleteModal.form.id);
      setForms(prev => prev.filter(f => f.id !== deleteModal.form.id));
      setTotalForms(prev => Math.max(0, prev - 1));
      setDeleteModal({ open: false, form: null });
    } catch (err) {
      console.error('Failed to delete feedback form:', err);
      alert(err.response?.data?.message || 'Failed to delete feedback form.');
    } finally {
      setDeleteLoading(false);
    }
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
            All Feedback Forms
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            System-wide view of all customer feedback collection forms created across tenant workspaces.
          </p>
        </div>

        <button 
          onClick={fetchForms}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px', minWidth: 0, position: 'relative' }}>
            <Search size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search by form title, slug, or organization name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-text"
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.25rem' }}>
            Filter
          </button>

          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="btn btn-secondary"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Forms Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Showing {forms.length} of {totalForms} forms platform-wide
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Form Details</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Owner Organization</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Submissions</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Avg Rating</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Created</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Public Link & Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner spinner-primary" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : forms.length > 0 ? (
                forms.map((form) => (
                  <tr key={form.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {/* Form Title & Slug */}
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        {form.title}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '2px' }}>
                        <Globe size={12} />
                        <span>/f/{form.slug}</span>
                      </div>
                    </td>

                    {/* Owner / Organization */}
                    <td style={{ padding: '1rem' }}>
                      {form.user_id ? (
                        <Link to={`/admin/users/${form.user_id}`} style={{ textDecoration: 'none', color: 'inherit' }} title="View creator details and responses">
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Building size={14} style={{ color: 'var(--text-secondary)' }} />
                            <span>{form.organization_name}</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#1B906F', fontWeight: 500 }}>
                            {form.owner_name} {form.owner_email ? `(${form.owner_email})` : ''}
                          </div>
                        </Link>
                      ) : (
                        <div>
                          <div style={{ fontWeight: 500, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Building size={14} style={{ color: 'var(--text-secondary)' }} />
                            <span>{form.organization_name}</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {form.owner_name} ({form.owner_email})
                          </div>
                        </div>
                      )}
                    </td>


                    {/* Submissions */}
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <Link 
                        to={`/admin/responses?form_id=${form.id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '12px',
                          background: 'var(--bg-secondary)',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          textDecoration: 'none'
                        }}
                        title="View submissions for this form"
                      >
                        <MessageSquare size={13} style={{ color: 'var(--text-secondary)' }} />
                        <span>{form.submissions_count}</span>
                      </Link>
                    </td>

                    {/* Average Rating */}
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      {form.average_rating ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 700, color: '#eab308' }}>
                          <span>{form.average_rating.toFixed(1)}</span>
                          <Star size={13} style={{ fill: '#eab308' }} />
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td style={{ padding: '1rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      {form.created_at}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setDeleteModal({ open: true, form })}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          title="Delete form"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>

                        <a
                          href={`/f/${form.slug}?preview=true`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                          title="Open live form questions page"
                        >
                          <span>Live Form</span>
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No feedback forms matching criteria found.
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

      {/* Delete Confirmation Modal */}
      {deleteModal.open && deleteModal.form && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-xl)',
            maxWidth: '460px',
            width: '100%',
            padding: '1.75rem',
            animation: 'fadeIn 0.15s ease-out'
          }}>
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
              Delete Feedback Form?
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <strong>{deleteModal.form.title}</strong>? All associated questions, sections, and customer responses will be permanently removed. This action cannot be undone.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDeleteModal({ open: false, form: null })}
                disabled={deleteLoading}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteForm}
                disabled={deleteLoading}
                className="btn btn-danger"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete Form'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
