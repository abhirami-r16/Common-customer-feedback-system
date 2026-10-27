import { useState } from 'react';
import { User, Building2, Lock, Shield, ArrowLeft, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  return (
    <DashboardLayout>
      <div className="dashboard-page-container">
        <div className="table-header-row" style={{ marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Account & Organization Settings</h2>
            <p style={{ color: 'var(--text-muted)' }}>Manage your personal details and business workspace</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '20px' }}>
          {/* User Profile Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="var(--primary)" />
              <span>User Profile</span>
            </h3>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input type="text" className="form-input" value={user?.name || ''} readOnly />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" value={user?.email || ''} readOnly />
            </div>
          </div>

          {/* Business Workspace Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="var(--secondary)" />
              <span>Business Workspace</span>
            </h3>

            <div className="form-group">
              <label className="form-label">Organization Name</label>
              <input type="text" className="form-input" value={user?.organization_name || ''} readOnly />
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
