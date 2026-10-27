import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, LogOut, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoIcon from '../assets/logo-icon.png';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isAdmin = user?.role === 'admin';
  const dashboardPath = isAdmin ? '/admin/dashboard' : '/dashboard';
  const dashboardLabel = isAdmin ? 'Admin Dashboard' : 'Business Dashboard';

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand">
          <img src={logoIcon} alt="FeedbackHub Logo" className="navbar-brand-logo" />
          <span className="brand-text">
            <span className="brand-text-feedback">Feedback</span>
            <span className="brand-text-hub">Hub</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav>
          <ul className="navbar-links">
            <li>
              <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                Home
              </Link>
            </li>

            <li>
              <a href="/#how-it-works" className="nav-link">
                How It Works
              </a>
            </li>

            <li>
              <a href="/#about" className="nav-link">
                About
              </a>
            </li>
            {isAuthenticated && (
              <li>
                <Link to={dashboardPath} className={`nav-link ${isActive(dashboardPath) ? 'active' : ''}`}>
                  {dashboardLabel}
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Action Buttons */}
        <div className="navbar-actions">
          <div className="navbar-actions-desktop">
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link
                  to={dashboardPath}
                  className="btn btn-secondary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.9rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderColor: isAdmin ? 'rgba(27, 144, 111, 0.4)' : undefined
                  }}
                >
                  {isAdmin ? <ShieldCheck size={16} style={{ color: '#1B906F' }} /> : <LayoutDashboard size={16} />}
                  <span>{user?.name || dashboardLabel}</span>
                  {isAdmin && (
                    <span style={{
                      fontSize: '0.65rem',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      background: 'rgba(27, 144, 111, 0.2)',
                      color: '#1B906F',
                      fontWeight: 700
                    }}>
                      ADMIN
                    </span>
                  )}
                </Link>
                <button
                  onClick={logout}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.9rem' }}
                  title="Log out"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-primary" style={{ padding: '9px 18px' }}>
                <LogIn size={16} />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`nav-link mobile-nav-link ${isActive('/') ? 'active' : ''}`}
          >
            Home
          </Link>

          <a
            href="/#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="nav-link mobile-nav-link"
          >
            How It Works
          </a>

          <a
            href="/#about"
            onClick={() => setMobileMenuOpen(false)}
            className="nav-link mobile-nav-link"
          >
            About
          </a>

          <div className="mobile-drawer-divider" />

          {isAuthenticated ? (
            <div className="mobile-drawer-actions">
              <Link
                to={dashboardPath}
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-secondary mobile-drawer-btn"
              >
                {isAdmin ? <ShieldCheck size={18} style={{ color: '#1B906F' }} /> : <LayoutDashboard size={18} />}
                <span>{dashboardLabel} ({user?.name})</span>
              </Link>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="btn btn-secondary mobile-drawer-btn"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="mobile-drawer-actions">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary mobile-drawer-btn"
              >
                <LogIn size={18} />
                <span>Sign In</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
