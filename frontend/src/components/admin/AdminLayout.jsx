import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Users, 
  FileText, 
  MessageSquare, 
  ArrowLeft, 
  Menu, 
  X, 
  LogOut, 
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import logoIcon from '../../assets/logo-icon.png';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'System Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Platform Users', path: '/admin/users', icon: Users },
    { name: 'All Feedback Forms', path: '/admin/forms', icon: FileText },
    { name: 'All Responses', path: '/admin/responses', icon: MessageSquare },
  ];

  const isActive = (path) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard' || location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'SA';

  return (
    <div className="dashboard-app-container" style={{ background: 'var(--bg-page)', minHeight: '100vh', display: 'flex' }}>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setMobileMenuOpen(false)} 
          aria-hidden="true" 
        />
      )}

      {/* Admin Sidebar */}
      <aside className={`dashboard-sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{ borderColor: 'var(--border-color)' }}>
        {/* Top Header */}
        <div className="sidebar-header" style={{ padding: '1.25rem 1.25rem 1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <img 
              src={logoIcon} 
              alt="FeedbackHub Logo" 
              style={{ width: '36px', height: '36px', objectFit: 'contain' }} 
            />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>
                <span className="brand-text">
                  <span className="brand-text-feedback">Feedback</span>
                  <span className="brand-text-hub">Hub</span>
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#1B906F', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Admin Portal
              </div>
            </div>
          </div>
          <button 
            type="button" 
            className="sidebar-close-btn" 
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Nav */}
        <nav className="sidebar-nav" style={{ padding: '1rem 0' }}>
          <div className="sidebar-section-label" style={{ letterSpacing: '0.05em' }}>PLATFORM MANAGEMENT</div>
          <ul className="sidebar-menu">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`sidebar-nav-item ${active ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                    style={active ? {
                      background: 'rgba(27, 144, 111, 0.12)',
                      color: '#1B906F',
                      borderLeft: '3px solid #1B906F',
                      fontWeight: 600
                    } : {}}
                  >
                    <Icon size={19} className="nav-icon" style={active ? { color: '#1B906F' } : {}} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #081B43 0%, #1B906F 100%)', color: '#fff' }}>
              {userInitials}
            </div>
            <div className="user-details">
              <span className="user-name" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {user?.name || 'Administrator'}
                <span style={{
                  fontSize: '0.65rem',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  background: 'rgba(27, 144, 111, 0.15)',
                  color: '#1B906F',
                  fontWeight: 700
                }}>ADMIN</span>
              </span>
              <span className="user-email">{user?.email}</span>
            </div>
            <button 
              onClick={handleLogout} 
              className="logout-icon-btn" 
              title="Sign Out"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dashboard-main-column" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Admin Topbar */}
        <header className="dashboard-topbar" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="topbar-left">
            <button 
              type="button" 
              className="topbar-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile menu"
            >
              <Menu size={22} />
            </button>
            <div className="topbar-title-wrap">
              <span className="topbar-breadcrumb admin-breadcrumb" style={{ color: '#1B906F', fontWeight: 600 }}>Super Admin /</span>
              <h1 className="topbar-page-title">
                {(location.pathname === '/admin' || location.pathname === '/admin/dashboard') && 'Platform Overview & Health'}
                {location.pathname === '/admin/users' && 'Platform Users & Organizations'}
                {location.pathname.startsWith('/admin/users/') && 'User Profile, Forms & Responses'}
                {location.pathname === '/admin/forms' && 'Feedback Forms'}
                {location.pathname === '/admin/responses' && 'Customer Submissions'}
              </h1>
            </div>
          </div>

          <div className="topbar-right" style={{ gap: '0.5rem' }}>
            <span className="admin-status-pill" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.65rem',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#10b981',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              <span className="status-text">System Online</span>
            </span>

            <button 
              type="button"
              onClick={handleLogout} 
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.65rem' }}
              title="Sign Out"
            >
              <LogOut size={14} />
              <span className="logout-btn-text">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Outlet */}
        <main className="dashboard-content-area admin-content-area" style={{ flex: 1, minWidth: 0, overflowX: 'hidden' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
