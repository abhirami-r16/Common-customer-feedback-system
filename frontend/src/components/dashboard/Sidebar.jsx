import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  Settings, 
  LogOut, 
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoIcon from '../../assets/logo-icon.png';

export default function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  // Navigation items
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Feedback Forms', path: '/dashboard/forms', icon: FileText },
    { name: 'Responses', path: '/dashboard/responses', icon: MessageSquare },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`dashboard-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Top Header / Brand */}
        <div className="sidebar-header">
          <Link to="/" className="navbar-brand" style={{ gap: '10px' }}>
            <img src={logoIcon} alt="FeedbackHub Logo" className="navbar-brand-logo" />
            <span className="brand-text" style={{ fontSize: '1.25rem' }}>
              <span className="brand-text-feedback">Feedback</span>
              <span className="brand-text-hub">Hub</span>
            </span>
          </Link>
          <button 
            type="button" 
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">MAIN MENU</div>
          <ul className="sidebar-menu">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`sidebar-nav-item ${active ? 'active' : ''}`}
                    onClick={() => {
                      if (onClose) onClose();
                    }}
                  >
                    <Icon size={19} className="nav-icon" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Section */}
        <div className="sidebar-footer">
          {/* User Profile Card */}
          <div className="sidebar-user-card">
            <div className="user-avatar" title={user?.name}>
              {userInitials}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name || 'Authorized User'}</span>
              <span className="user-email">{user?.email || 'user@example.com'}</span>
            </div>
            <button 
              onClick={logout} 
              className="logout-icon-btn" 
              title="Sign Out"
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
