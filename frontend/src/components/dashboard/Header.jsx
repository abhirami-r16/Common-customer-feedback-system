import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Search, 
  User, 
  Settings, 
  LogOut, 
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ pageTitle = 'Dashboard', onMenuClick, onSearchChange, searchValue = '' }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'U';

  return (
    <header className="dashboard-topbar">
      <div className="topbar-left">
        {/* Mobile Hamburger Button */}
        <button 
          type="button" 
          className="topbar-menu-btn"
          onClick={onMenuClick}
          aria-label="Open sidebar menu"
        >
          <Menu size={22} />
        </button>

        {/* Breadcrumb / Title */}
        <div className="topbar-title-wrap">
          <span className="topbar-breadcrumb">Overview /</span>
          <h1 className="topbar-page-title">{pageTitle}</h1>
        </div>
      </div>

      {/* Center Search Input */}
      <div className="topbar-search-wrap">
        <Search size={17} className="search-icon" />
        <input
          type="text"
          className="topbar-search-input"
          placeholder="Search forms, responses..."
          value={searchValue}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          aria-label="Search forms and responses"
        />
      </div>

      {/* Right Actions */}
      <div className="topbar-right">
        {/* User Dropdown */}
        <div className="topbar-user-dropdown" ref={dropdownRef}>
          <button 
            type="button" 
            className="user-dropdown-trigger"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
          >
            <div className="user-avatar-sm">{userInitials}</div>
            <div className="user-text-wrap">
              <span className="user-firstname">{user?.name ? user.name.split(' ')[0] : 'User'}</span>
            </div>
            <ChevronDown size={14} className="dropdown-arrow" />
          </button>

          {dropdownOpen && (
            <div className="user-dropdown-menu">
              <div className="dropdown-user-info">
                <strong>{user?.name}</strong>
                <small>{user?.email}</small>
                {user?.organization_name && (
                  <span className="dropdown-org-badge">{user.organization_name}</span>
                )}
              </div>

              <div className="dropdown-divider" />

              <Link 
                to="/dashboard/settings" 
                className="dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                <User size={15} />
                <span>My Profile</span>
              </Link>

              <Link 
                to="/dashboard/settings" 
                className="dropdown-item"
                onClick={() => setDropdownOpen(false)}
              >
                <Settings size={15} />
                <span>Account Settings</span>
              </Link>

              <div className="dropdown-divider" />

              <button 
                type="button" 
                className="dropdown-item dropdown-logout"
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
              >
                <LogOut size={15} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
