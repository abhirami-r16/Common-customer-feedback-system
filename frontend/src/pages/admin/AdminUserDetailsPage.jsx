import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  MessageSquare,
  Star,
  Shield,
  ShieldCheck,
  Building,
  Mail,
  Calendar,
  Clock,
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  BarChart2,
  FolderOpen,
  X
} from 'lucide-react';
import { adminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminUserDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('forms'); // 'forms' | 'responses' | 'overview'

  // Forms tab filters
  const [formSearch, setFormSearch] = useState('');
  const [formStatusFilter, setFormStatusFilter] = useState('');
  const [copiedSlug, setCopiedSlug] = useState(null);

  // Responses tab filters
  const [responseSearch, setResponseSearch] = useState('');
  const [responseRatingFilter, setResponseRatingFilter] = useState('');
  const [responseFormFilter, setResponseFormFilter] = useState('');
  const [expandedResponseIds, setExpandedResponseIds] = useState(new Set());

  // Action Modals
  const [modalState, setModalState] = useState({ open: false, type: '', payload: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [bannerMessage, setBannerMessage] = useState(null);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getUserDetails(id);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load user details:', err);
      setError(err.message || 'Unable to load user details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchUserDetails();
    }
  }, [id]);

  const copyShareLink = (slug) => {
    const url = `${window.location.origin}/f/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const toggleExpandResponse = (respId) => {
    setExpandedResponseIds((prev) => {
      const next = new Set(prev);
      if (next.has(respId)) {
        next.delete(respId);
      } else {
        next.add(respId);
      }
      return next;
    });
  };

  const handleRoleToggle = async () => {
    if (!data?.user) return;
    setActionLoading(true);
    const targetUser = data.user;
    const newRole = targetUser.role === 'admin' ? 'business' : 'admin';

    try {
      await adminService.updateUserRole(targetUser.id, newRole);
      setBannerMessage({
        type: 'success',
        text: `Role for ${targetUser.name} changed to ${newRole.toUpperCase()} successfully.`
      });
      setModalState({ open: false, type: '', payload: null });
      fetchUserDetails();
    } catch (err) {
      alert(err.message || 'Failed to update user role.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!data?.user) return;
    setActionLoading(true);
    try {
      await adminService.deleteUser(data.user.id);
      navigate('/admin/users');
    } catch (err) {
      alert(err.message || 'Failed to delete user.');
      setActionLoading(false);
      setModalState({ open: false, type: '', payload: null });
    }
  };

  const handleDeleteResponse = async () => {
    if (!modalState.payload) return;
    setActionLoading(true);
    try {
      await adminService.deleteResponse(modalState.payload.id);
      setBannerMessage({
        type: 'success',
        text: 'Customer response was deleted successfully.'
      });
      setModalState({ open: false, type: '', payload: null });
      fetchUserDetails();
    } catch (err) {
      alert(err.message || 'Failed to delete response.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner spinner-primary" style={{ width: '40px', height: '40px' }} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="card text-center" style={{ padding: '3.5rem 2rem', maxWidth: '540px', margin: '3rem auto' }}>
        <AlertCircle size={44} style={{ color: 'var(--danger)', margin: '0 auto 1.25rem auto' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>User Not Found or Error</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', fontSize: '0.9rem' }}>{error}</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <Link to="/admin/users" className="btn btn-secondary">
            <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Users
          </Link>
          <button onClick={fetchUserDetails} className="btn btn-primary">
            <RefreshCw size={15} style={{ marginRight: '6px' }} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const { user = {}, metrics = {}, forms = [], responses = [] } = data || {};
  const isSelf = user.id === currentUser?.id;
  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  // Filtered forms
  const filteredForms = forms.filter((f) => {
    const matchesSearch =
      !formSearch.trim() ||
      f.title?.toLowerCase().includes(formSearch.toLowerCase()) ||
      f.slug?.toLowerCase().includes(formSearch.toLowerCase()) ||
      f.description?.toLowerCase().includes(formSearch.toLowerCase());
    const matchesStatus = !formStatusFilter || f.status === formStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered responses
  const filteredResponses = responses.filter((r) => {
    const matchesSearch =
      !responseSearch.trim() ||
      r.customer_name?.toLowerCase().includes(responseSearch.toLowerCase()) ||
      r.customer_email?.toLowerCase().includes(responseSearch.toLowerCase()) ||
      r.summary_preview?.toLowerCase().includes(responseSearch.toLowerCase()) ||
      r.form_title?.toLowerCase().includes(responseSearch.toLowerCase());
    const matchesRating = !responseRatingFilter || Number(r.rating) === Number(responseRatingFilter);
    const matchesForm = !responseFormFilter || String(r.feedback_form_id) === String(responseFormFilter);
    return matchesSearch && matchesRating && matchesForm;
  });

  const ratingDist = metrics.rating_distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const totalRated = metrics.total_rated_responses || 1;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Navigation & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <Link
          to="/admin/users"
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', textDecoration: 'none' }}
        >
          <ArrowLeft size={15} />
          <span>Back to All Users</span>
        </Link>

        <button
          onClick={fetchUserDetails}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          title="Refresh user data"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {bannerMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid #10b981',
            color: '#10b981',
            fontSize: '0.9rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle size={18} />
            <span>{bannerMessage.text}</span>
          </div>
          <button
            onClick={() => setBannerMessage(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* User Hero Banner Card */}
      <div
        className="card"
        style={{
          padding: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background:
                user.role === 'admin'
                  ? 'linear-gradient(135deg, #081B43 0%, #1B906F 100%)'
                  : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              fontWeight: 800,
              boxShadow: user.role === 'admin' ? '0 8px 20px rgba(27, 144, 111, 0.35)' : '0 8px 20px rgba(2, 132, 199, 0.25)'
            }}
          >
            {initials}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {user.name}
              </h1>

              {isSelf && (
                <span
                  style={{
                    fontSize: '0.725rem',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: 'rgba(27, 144, 111, 0.15)',
                    color: '#1B906F',
                    fontWeight: 700
                  }}
                >
                  YOU
                </span>
              )}

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: user.role === 'admin' ? 'rgba(27, 144, 111, 0.15)' : 'var(--bg-secondary)',
                  color: user.role === 'admin' ? '#1B906F' : 'var(--text-secondary)',
                  border: user.role === 'admin' ? '1px solid rgba(27, 144, 111, 0.3)' : '1px solid var(--border-color)'
                }}
              >
                {user.role === 'admin' ? <ShieldCheck size={14} /> : <Shield size={14} />}
                <span>{user.role === 'admin' ? 'Platform Administrator' : 'Standard Tenant'}</span>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Mail size={15} style={{ color: 'var(--text-tertiary)' }} />
                <span>{user.email}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building size={15} style={{ color: 'var(--text-tertiary)' }} />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user.organization_name || 'Individual Creator'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={15} style={{ color: 'var(--text-tertiary)' }} />
                <span>Joined {user.created_at} ({user.created_at_relative})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setModalState({ open: true, type: 'role', payload: null })}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            {user.role === 'admin' ? <Shield size={15} /> : <ShieldCheck size={15} />}
            <span>{user.role === 'admin' ? 'Revoke Admin' : 'Grant Admin'}</span>
          </button>

          {!isSelf && (
            <button
              type="button"
              onClick={() => setModalState({ open: true, type: 'delete', payload: null })}
              className="btn btn-danger btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <Trash2 size={15} />
              <span>Delete Account</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metrics Summary Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {/* Total Forms */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Created Forms
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
              <FileText size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {metrics.total_forms || 0}
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.75rem' }}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>● {metrics.published_forms || 0} Published</span>
            <span style={{ color: '#f59e0b', fontWeight: 600 }}>● {metrics.draft_forms || 0} Drafts</span>
          </div>
        </div>

        {/* Total Responses */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Responses Received
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
              <MessageSquare size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
            {metrics.total_responses || 0}
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Total customer feedback entries across all user's forms
          </div>
        </div>

        {/* Average Rating */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Average Rating
            </span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Star size={20} fill="#f59e0b" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', lineHeight: 1 }}>
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {metrics.average_rating ? metrics.average_rating : 'N/A'}
            </span>
            {metrics.average_rating && (
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>/ 5.0</span>
            )}
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                style={{
                  color: star <= Math.round(metrics.average_rating || 0) ? '#f59e0b' : 'var(--border-color)',
                  fill: star <= Math.round(metrics.average_rating || 0) ? '#f59e0b' : 'none'
                }}
              />
            ))}
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>
              ({metrics.total_rated_responses || 0} rated)
            </span>
          </div>
        </div>

        {/* Rating Breakdown Progress */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Satisfaction Distribution
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {[5, 4, 3, 2, 1].map((r) => {
              const count = ratingDist[r] || 0;
              const pct = totalRated > 0 ? Math.round((count / totalRated) * 100) : 0;
              return (
                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                  <span style={{ width: '22px', fontWeight: 600, color: 'var(--text-secondary)' }}>{r}★</span>
                  <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        borderRadius: '3px',
                        background: r >= 4 ? '#10b981' : r === 3 ? '#f59e0b' : '#ef4444'
                      }}
                    />
                  </div>
                  <span style={{ width: '28px', textAlign: 'right', color: 'var(--text-tertiary)' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div
        className="admin-tabs-nav"
        style={{
          display: 'flex',
          borderBottom: '2px solid var(--border-color)',
          gap: '0.5rem',
          paddingBottom: '0.25rem',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('forms')}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.75rem 1.25rem',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderBottom: activeTab === 'forms' ? '3px solid #1B906F' : '3px solid transparent',
            color: activeTab === 'forms' ? '#1B906F' : 'var(--text-secondary)',
            marginBottom: '-4px',
            transition: 'all 0.15s ease'
          }}
        >
          <FileText size={18} />
          <span>Forms Created</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              background: activeTab === 'forms' ? 'rgba(27, 144, 111, 0.15)' : 'var(--bg-secondary)',
              color: activeTab === 'forms' ? '#1B906F' : 'var(--text-tertiary)'
            }}
          >
            {forms.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('responses')}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.75rem 1.25rem',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderBottom: activeTab === 'responses' ? '3px solid #1B906F' : '3px solid transparent',
            color: activeTab === 'responses' ? '#1B906F' : 'var(--text-secondary)',
            marginBottom: '-4px',
            transition: 'all 0.15s ease'
          }}
        >
          <MessageSquare size={18} />
          <span>Responses Created & Received</span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              background: activeTab === 'responses' ? 'rgba(27, 144, 111, 0.15)' : 'var(--bg-secondary)',
              color: activeTab === 'responses' ? '#1B906F' : 'var(--text-tertiary)'
            }}
          >
            {responses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.75rem 1.25rem',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            borderBottom: activeTab === 'overview' ? '3px solid #1B906F' : '3px solid transparent',
            color: activeTab === 'overview' ? '#1B906F' : 'var(--text-secondary)',
            marginBottom: '-4px',
            transition: 'all 0.15s ease'
          }}
        >
          <Users size={18} />
          <span>User Profile Details</span>
        </button>
      </div>

      {/* TAB 1: FORMS CREATED */}
      {activeTab === 'forms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Form Search & Filters */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 300px', position: 'relative' }}>
                <Search
                  size={17}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)'
                  }}
                />
                <input
                  type="text"
                  placeholder="Search forms by title, slug, or keywords..."
                  value={formSearch}
                  onChange={(e) => setFormSearch(e.target.value)}
                  className="input-text"
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                />
              </div>

              <div style={{ width: '180px' }}>
                <select
                  value={formStatusFilter}
                  onChange={(e) => setFormStatusFilter(e.target.value)}
                  className="input-select"
                  style={{ width: '100%' }}
                >
                  <option value="">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="unpublished">Unpublished</option>
                </select>
              </div>

              {(formSearch || formStatusFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setFormSearch('');
                    setFormStatusFilter('');
                  }}
                  className="btn btn-secondary"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Forms Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Showing {filteredForms.length} of {forms.length} forms created by {user.name}
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      Form Title & Slug
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      Status
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      Responses
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      Avg Rating
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      Created Date
                    </th>
                    <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredForms.length > 0 ? (
                    filteredForms.map((form) => {
                      const isPublished = form.status === 'published';
                      const isDraft = form.status === 'draft';
                      const isCopied = copiedSlug === form.slug;

                      return (
                        <tr key={form.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          {/* Title & Slug */}
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                              {form.title}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              <code>/f/{form.slug}</code>
                              {form.description && (
                                <span style={{ color: 'var(--text-tertiary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  • {form.description}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '1rem' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.25rem 0.65rem',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: isPublished ? 'rgba(16, 185, 129, 0.12)' : isDraft ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-secondary)',
                                color: isPublished ? '#10b981' : isDraft ? '#f59e0b' : 'var(--text-secondary)',
                                border: isPublished ? '1px solid rgba(16, 185, 129, 0.25)' : isDraft ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid var(--border-color)'
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPublished ? '#10b981' : isDraft ? '#f59e0b' : 'var(--text-secondary)' }} />
                              <span style={{ textTransform: 'capitalize' }}>{form.status}</span>
                            </span>
                          </td>

                          {/* Responses Count */}
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setResponseFormFilter(String(form.id));
                                setActiveTab('responses');
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.2rem 0.65rem', fontSize: '0.8rem', fontWeight: 600 }}
                              title="Click to view responses for this form"
                            >
                              <MessageSquare size={13} style={{ marginRight: '4px' }} />
                              {form.submissions_count} responses
                            </button>
                          </td>

                          {/* Rating */}
                          <td style={{ padding: '1rem', textAlign: 'center' }}>
                            {form.average_rating ? (
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 700, color: '#f59e0b' }}>
                                <Star size={14} fill="#f59e0b" />
                                <span>{form.average_rating}</span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>—</span>
                            )}
                          </td>

                          {/* Created Date */}
                          <td style={{ padding: '1rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                            <div>{form.created_at}</div>
                            {form.last_response_at && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                                Last response: {form.last_response_at}
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                              <button
                                type="button"
                                onClick={() => copyShareLink(form.slug)}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                                title="Copy public form URL"
                              >
                                {isCopied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                                <span style={{ marginLeft: '4px' }}>{isCopied ? 'Copied' : 'Share'}</span>
                              </button>

                              <a
                                href={`/f/${form.slug}?preview=true`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '0.35rem 0.5rem' }}
                                title="Open live form questions page"
                              >
                                <ExternalLink size={14} />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-secondary)' }}>
                        <FolderOpen size={36} style={{ margin: '0 auto 0.75rem auto', color: 'var(--text-tertiary)' }} />
                        <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>
                          No forms found
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: 0 }}>
                          {formSearch || formStatusFilter
                            ? 'Try adjusting your search or status filter.'
                            : `${user.name} has not created any feedback forms yet.`}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RESPONSES CREATED / RECEIVED */}
      {activeTab === 'responses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Response Filters */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1 1 260px', position: 'relative' }}>
                <Search
                  size={17}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-secondary)'
                  }}
                />
                <input
                  type="text"
                  placeholder="Search by customer, email, response feedback..."
                  value={responseSearch}
                  onChange={(e) => setResponseSearch(e.target.value)}
                  className="input-text"
                  style={{ paddingLeft: '2.5rem', width: '100%' }}
                />
              </div>

              {/* Form Filter Dropdown */}
              <div style={{ width: '220px' }}>
                <select
                  value={responseFormFilter}
                  onChange={(e) => setResponseFormFilter(e.target.value)}
                  className="input-select"
                  style={{ width: '100%' }}
                >
                  <option value="">All Forms ({forms.length})</option>
                  {forms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title} ({f.submissions_count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating Filter Dropdown */}
              <div style={{ width: '150px' }}>
                <select
                  value={responseRatingFilter}
                  onChange={(e) => setResponseRatingFilter(e.target.value)}
                  className="input-select"
                  style={{ width: '100%' }}
                >
                  <option value="">All Ratings</option>
                  <option value="5">5 Stars ★</option>
                  <option value="4">4 Stars ★</option>
                  <option value="3">3 Stars ★</option>
                  <option value="2">2 Stars ★</option>
                  <option value="1">1 Star ★</option>
                </select>
              </div>

              {(responseSearch || responseRatingFilter || responseFormFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setResponseSearch('');
                    setResponseRatingFilter('');
                    setResponseFormFilter('');
                  }}
                  className="btn btn-secondary"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Responses List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Showing {filteredResponses.length} of {responses.length} responses received on {user.name}'s forms
              </span>
            </div>

            {filteredResponses.length > 0 ? (
              filteredResponses.map((sub) => {
                const isExpanded = expandedResponseIds.has(sub.id);
                const hasDetailedAnswers = Array.isArray(sub.answers) && sub.answers.length > 0;

                return (
                  <div
                    key={sub.id}
                    className="card"
                    style={{
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      borderLeft: sub.rating >= 4 ? '4px solid #10b981' : sub.rating === 3 ? '4px solid #f59e0b' : '4px solid #ef4444'
                    }}
                  >
                    {/* Header: Customer info, rating, and actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'var(--bg-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            fontSize: '0.9rem',
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          {sub.customer_name ? sub.customer_name[0].toUpperCase() : 'A'}
                        </div>

                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                            {sub.customer_name || 'Anonymous Customer'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {sub.customer_email || 'No email provided'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Rating */}
                        {sub.rating ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-secondary)', padding: '0.25rem 0.65rem', borderRadius: '12px' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                style={{
                                  color: star <= sub.rating ? '#f59e0b' : 'var(--border-color)',
                                  fill: star <= sub.rating ? '#f59e0b' : 'none'
                                }}
                              />
                            ))}
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b', marginLeft: '4px' }}>
                              {sub.rating}.0
                            </span>
                          </div>
                        ) : null}

                        {/* Date */}
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', textAlign: 'right' }}>
                          <div>{sub.created_at}</div>
                          <div style={{ fontSize: '0.72rem' }}>{sub.created_at_relative}</div>
                        </div>

                        {/* Delete action */}
                        <button
                          type="button"
                          onClick={() => setModalState({ open: true, type: 'delete_response', payload: sub })}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.5rem', color: 'var(--danger)' }}
                          title="Delete response"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Form Origin badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-tertiary)' }}>Submitted on Form:</span>
                      <span
                        style={{
                          fontWeight: 600,
                          color: '#1B906F',
                          background: 'rgba(27, 144, 111, 0.1)',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}
                      >
                        {sub.form_title}
                      </span>
                    </div>

                    {/* Summary preview */}
                    <div
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: '8px',
                        background: 'var(--bg-secondary)',
                        fontSize: '0.875rem',
                        color: 'var(--text-primary)',
                        lineHeight: 1.5
                      }}
                    >
                      {sub.summary_preview}
                    </div>

                    {/* Expand detailed questions and answers */}
                    {hasDetailedAnswers && (
                      <div>
                        <button
                          type="button"
                          onClick={() => toggleExpandResponse(sub.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#1B906F',
                            fontSize: '0.825rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: 0
                          }}
                        >
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          <span>{isExpanded ? 'Hide All Submitted Answers' : `View Complete Question Answers (${sub.answers.length})`}</span>
                        </button>

                        {isExpanded && (
                          <div
                            style={{
                              marginTop: '0.85rem',
                              padding: '1rem',
                              borderRadius: '8px',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-primary)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.75rem'
                            }}
                          >
                            {sub.answers.map((item, idx) => (
                              <div
                                key={idx}
                                style={{
                                  borderBottom: idx < sub.answers.length - 1 ? '1px dashed var(--border-color)' : 'none',
                                  paddingBottom: idx < sub.answers.length - 1 ? '0.75rem' : 0
                                }}
                              >
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                                  {idx + 1}. {item.question}
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                                  {Array.isArray(item.answer) ? item.answer.join(', ') : String(item.answer ?? '—')}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="card text-center" style={{ padding: '3.5rem 1rem', color: 'var(--text-secondary)' }}>
                <MessageSquare size={36} style={{ margin: '0 auto 0.75rem auto', color: 'var(--text-tertiary)' }} />
                <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>
                  No responses found
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', margin: 0 }}>
                  {responseSearch || responseRatingFilter || responseFormFilter
                    ? 'No responses matched your search and filter criteria.'
                    : `No responses have been submitted to ${user.name}'s forms yet.`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: USER PROFILE DETAILS */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.25rem' }}>
          {/* Identity & Account Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
              Account Credentials & Identity
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Database User ID</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>#{user.id}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Full Legal Name</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{user.name}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Primary Email</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{user.email}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Business Organization</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                  {user.organization_name || 'Independent / Individual'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Platform Role</span>
                <span
                  style={{
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    fontSize: '0.8rem',
                    color: user.role === 'admin' ? '#1B906F' : 'var(--text-primary)'
                  }}
                >
                  {user.role}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.25rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Registration Date</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                  {user.created_at} ({user.created_at_relative})
                </span>
              </div>
            </div>
          </div>

          {/* Activity & Performance Metrics */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem' }}>
              Platform Engagement & Output
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Forms Built</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{forms.length}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Published Forms (Live)</span>
                <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.9rem' }}>
                  {metrics.published_forms || 0}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Draft / Work-in-Progress</span>
                <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.9rem' }}>
                  {metrics.draft_forms || 0}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Total Customer Responses</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                  {responses.length}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.25rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Overall Customer CSAT</span>
                <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '0.9rem' }}>
                  {metrics.average_rating ? `${metrics.average_rating} / 5.0 ★` : 'No rating data'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      {modalState.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '1.75rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background:
                  modalState.type === 'delete' || modalState.type === 'delete_response'
                    ? 'var(--danger-bg)'
                    : 'rgba(27, 144, 111, 0.15)',
                color:
                  modalState.type === 'delete' || modalState.type === 'delete_response'
                    ? 'var(--danger)'
                    : '#1B906F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}
            >
              {modalState.type === 'delete' || modalState.type === 'delete_response' ? (
                <Trash2 size={24} />
              ) : (
                <ShieldCheck size={24} />
              )}
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {modalState.type === 'delete'
                ? 'Delete User Account'
                : modalState.type === 'delete_response'
                ? 'Delete Customer Response'
                : 'Change Role Privilege'}
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {modalState.type === 'delete' ? (
                <>
                  Are you sure you want to permanently delete <strong>{user.name}</strong> ({user.email})?
                  All {forms.length} created forms and {responses.length} customer responses will also be permanently deleted.
                </>
              ) : modalState.type === 'delete_response' ? (
                <>
                  Are you sure you want to delete the response submitted by{' '}
                  <strong>{modalState.payload?.customer_name || 'Anonymous Customer'}</strong> on{' '}
                  <strong>{modalState.payload?.form_title}</strong>? This cannot be undone.
                </>
              ) : (
                <>
                  Change role for <strong>{user.name}</strong> from{' '}
                  <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{user.role}</span> to{' '}
                  <strong style={{ textTransform: 'uppercase', color: '#1B906F' }}>
                    {user.role === 'admin' ? 'user' : 'admin'}
                  </strong>
                  ?
                </>
              )}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setModalState({ open: false, type: '', payload: null })}
                disabled={actionLoading}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={
                  modalState.type === 'delete'
                    ? handleDeleteUser
                    : modalState.type === 'delete_response'
                    ? handleDeleteResponse
                    : handleRoleToggle
                }
                disabled={actionLoading}
                className={
                  modalState.type === 'delete' || modalState.type === 'delete_response'
                    ? 'btn btn-danger'
                    : 'btn btn-primary'
                }
                style={
                  modalState.type !== 'delete' && modalState.type !== 'delete_response'
                    ? { background: '#1B906F', borderColor: '#1B906F' }
                    : {}
                }
              >
                {actionLoading
                  ? 'Processing...'
                  : modalState.type === 'delete'
                  ? 'Yes, Delete Account'
                  : modalState.type === 'delete_response'
                  ? 'Yes, Delete Response'
                  : 'Confirm Role Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
