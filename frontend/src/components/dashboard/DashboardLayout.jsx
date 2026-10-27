import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children, searchValue, onSearchChange }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Determine current page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard/forms') return 'Feedback Forms';
    if (path === '/dashboard/responses') return 'Responses';
    if (path === '/dashboard/analytics') return 'Analytics';
    if (path === '/dashboard/settings') return 'Settings';
    if (path.includes('/dashboard/forms/create')) {
      return location.search.includes('edit=') ? 'Edit Feedback Form' : 'Create Feedback Form';
    }
    return 'Dashboard';
  };

  return (
    <div className="dashboard-app-container">
      {/* Left Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Column */}
      <div className="dashboard-main-column">
        <Header 
          pageTitle={getPageTitle()}
          onMenuClick={() => setSidebarOpen(true)}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
        />

        <main className="dashboard-content-area">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}
