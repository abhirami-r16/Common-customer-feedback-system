import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Trash2, 
  UserCheck, 
  RefreshCw, 
  AlertCircle,
  Building,
  CheckCircle,
  Eye,
  X
} from 'lucide-react';
import { adminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Modal / Confirm state
  const [actionModal, setActionModal] = useState({ open: false, type: '', user: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [bannerMessage, setBannerMessage] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        page,
      });
      setUsers(res.data.data || []);
      setTotalPages(res.data.last_page || 1);
      setTotalUsers(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleRoleToggle = async () => {
    if (!actionModal.user) return;
    setActionLoading(true);
    const targetUser = actionModal.user;
    const newRole = targetUser.role === 'admin' ? 'business' : 'admin';

    try {
      await adminService.updateUserRole(targetUser.id, newRole);
      setBannerMessage({
        type: 'success',
        text: `Role for ${targetUser.name} changed to ${newRole.toUpperCase()} successfully.`
      });
      setActionModal({ open: false, type: '', user: null });
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Failed to update user role.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!actionModal.user) return;
    setActionLoading(true);
    const targetUser = actionModal.user;

    try {
      await adminService.deleteUser(targetUser.id);
      setBannerMessage({
        type: 'success',
        text: `Account for ${targetUser.name} and all related forms were deleted.`
      });
      setActionModal({ open: false, type: '', user: null });
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Failed to delete user.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
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
            Platform Users & Organizations
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage registered workspace owners, permissions, and platform administrator roles.
          </p>
        </div>

        <button 
          onClick={fetchUsers}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
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

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 200px', minWidth: 0, position: 'relative' }}>
            <Search size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search by name, email, or company name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-text"
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>

          <div style={{ width: '160px', flex: '1 1 140px', minWidth: 0 }}>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="input-select"
              style={{ width: '100%' }}
            >
              <option value="">All Roles</option>
              <option value="business">Business Customers</option>
              <option value="admin">Platform Admins</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.25rem' }}>
            Filter
          </button>

          {(search || roleFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setRoleFilter('');
                setPage(1);
              }}
              className="btn btn-secondary"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Showing {users.length} of {totalUsers} registered users
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>User</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Organization</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Role</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Forms</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Submissions</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Registered</th>
                <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="spinner spinner-primary" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const initials = u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      {/* Name / Email */}
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <Link
                          to={`/admin/users/${u.id}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit' }}
                        >
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: u.role === 'admin' ? 'linear-gradient(135deg, #081B43, #1B906F)' : 'var(--bg-secondary)',
                            color: u.role === 'admin' ? '#ffffff' : 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            border: '1px solid var(--border-color)',
                            flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ color: '#1B906F' }}>{u.name}</span>
                              {isCurrent && (
                                <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(27, 144, 111, 0.15)', color: '#1B906F', fontWeight: 600 }}>YOU</span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                          </div>
                        </Link>
                      </td>

                      {/* Organization */}
                      <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Building size={14} style={{ color: 'var(--text-secondary)' }} />
                          <span style={{ fontWeight: 500 }}>{u.organization_name || 'Independent'}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '20px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: u.role === 'admin' ? 'rgba(27, 144, 111, 0.15)' : 'var(--bg-secondary)',
                          color: u.role === 'admin' ? '#1B906F' : 'var(--text-secondary)',
                          border: u.role === 'admin' ? '1px solid rgba(27, 144, 111, 0.3)' : '1px solid var(--border-color)'
                        }}>
                          {u.role === 'admin' ? <ShieldCheck size={13} /> : <Shield size={13} />}
                          <span>{u.role === 'admin' ? 'Administrator' : 'Standard User'}</span>
                        </span>
                      </td>

                      {/* Forms Count */}
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          background: 'var(--bg-secondary)',
                          fontSize: '0.85rem'
                        }}>
                          {u.forms_count}
                        </span>
                      </td>

                      {/* Submissions Count */}
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          background: 'var(--bg-secondary)',
                          fontSize: '0.85rem'
                        }}>
                          {u.submissions_count}
                        </span>
                      </td>

                      {/* Created At */}
                      <td style={{ padding: '1rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                        <div>{u.created_at}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{u.created_at_relative}</div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Link
                            to={`/admin/users/${u.id}`}
                            className="btn btn-secondary btn-sm"
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.35rem 0.65rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              textDecoration: 'none',
                              color: 'var(--text-primary)'
                            }}
                            title="View user details, forms, and responses"
                          >
                            <Eye size={13} style={{ color: '#1B906F' }} />
                            <span>Details</span>
                          </Link>

                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => setActionModal({ open: true, type: 'delete', user: u })}
                              className="btn btn-danger btn-sm"
                              style={{ padding: '0.35rem 0.5rem' }}
                              title="Delete user account"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No users matching criteria found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
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

      {/* Confirmation Modal */}
      {actionModal.open && actionModal.user && (
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
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '1.75rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: actionModal.type === 'delete' ? 'var(--danger-bg)' : 'rgba(27, 144, 111, 0.15)',
              color: actionModal.type === 'delete' ? 'var(--danger)' : '#1B906F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              {actionModal.type === 'delete' ? <Trash2 size={24} /> : <ShieldCheck size={24} />}
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              {actionModal.type === 'delete' ? 'Delete User Account' : 'Change Role Privilege'}
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {actionModal.type === 'delete' ? (
                <>
                  Are you sure you want to permanently delete <strong>{actionModal.user.name}</strong> ({actionModal.user.email})?
                  All associated feedback forms and customer submissions will also be deleted.
                </>
              ) : (
                <>
                  Change role for <strong>{actionModal.user.name}</strong> from{' '}
                  <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{actionModal.user.role}</span> to{' '}
                  <strong style={{ textTransform: 'uppercase', color: '#1B906F' }}>
                    {actionModal.user.role === 'admin' ? 'business' : 'admin'}
                  </strong>
                  ?
                </>
              )}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setActionModal({ open: false, type: '', user: null })}
                disabled={actionLoading}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={actionModal.type === 'delete' ? handleDeleteUser : handleRoleToggle}
                disabled={actionLoading}
                className={actionModal.type === 'delete' ? 'btn btn-danger' : 'btn btn-primary'}
                style={actionModal.type !== 'delete' ? { background: '#1B906F', borderColor: '#1B906F' } : {}}
              >
                {actionLoading ? 'Processing...' : actionModal.type === 'delete' ? 'Yes, Delete Account' : 'Confirm Role Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
