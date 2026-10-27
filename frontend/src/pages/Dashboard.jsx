import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  Calendar, 
  AlertCircle, 
  ShieldCheck, 
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/api';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import MetricCards from '../components/dashboard/MetricCards';
import AnalyticsCharts from '../components/dashboard/AnalyticsCharts';
import RecentFormsTable from '../components/dashboard/RecentFormsTable';
import RecentResponsesTable from '../components/dashboard/RecentResponsesTable';


export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedDays, setSelectedDays] = useState(30);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDashboardData = useCallback(async (days = selectedDays) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await dashboardService.getStats(days);
      setDashboardData(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
      setError(
        err.message || 'Unable to connect to the backend server. Please verify that "php artisan serve" is running.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedDays]);

  useEffect(() => {
    fetchDashboardData(selectedDays);
  }, [selectedDays, fetchDashboardData]);

  const handlePeriodChange = (days) => {
    setSelectedDays(days);
  };

  const handleDeleteForm = async (id) => {
    try {
      await dashboardService.deleteForm(id);
      // Refresh metrics and forms table
      fetchDashboardData(selectedDays);
    } catch (err) {
      alert(err.message || 'Failed to delete form. Please try again.');
    }
  };

  return (
    <DashboardLayout searchValue={searchQuery} onSearchChange={setSearchQuery}>
      <div className="dashboard-page-container">
        {/* Welcome Section */}
        <div className="dashboard-welcome-banner">
          <div className="welcome-text-col">
            <div className="welcome-org-pill">
              <Building2 size={13} />
              <span>{user?.organization_name || 'Business Workspace'}</span>
            </div>
            <h2 className="welcome-heading">Dashboard</h2>
            <p className="welcome-subheading">
              Track customer feedback and understand how your business is performing.
            </p>
          </div>

          <div className="welcome-actions-col">
            {/* Date Range Selector */}
            <div className="date-range-selector">
              <Calendar size={15} className="date-icon" />
              <select
                className="date-select"
                value={selectedDays}
                onChange={(e) => handlePeriodChange(Number(e.target.value))}
                disabled={isLoading}
                aria-label="Select date range filter"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
              </select>
            </div>

            {/* Create Form Action */}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/dashboard/forms/create')}
            >
              <PlusCircle size={16} />
              <span>Create Form</span>
            </button>
          </div>
        </div>

        {/* Backend Error Notification */}
        {error && (
          <div className="alert alert-danger" role="alert" style={{ marginBottom: '24px' }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <strong>Backend Connection Issue</strong>
              <p style={{ marginTop: '2px', fontSize: '0.88rem' }}>{error}</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
              onClick={() => fetchDashboardData(selectedDays)}
            >
              Retry
            </button>
          </div>
        )}

        {/* 1. Overview Metric Cards */}
        <section aria-label="Key Performance Indicators" style={{ marginBottom: '28px' }}>
          <MetricCards 
            metrics={dashboardData?.metrics} 
            isLoading={isLoading && !dashboardData} 
          />
        </section>

        {/* 2. Analytics Section */}
        <section aria-label="Analytics and Satisfaction Charts" style={{ marginBottom: '28px' }}>
          <AnalyticsCharts
            charts={dashboardData?.charts}
            selectedDays={selectedDays}
            onDaysChange={handlePeriodChange}
            isLoading={isLoading && !dashboardData}
          />
        </section>

        {/* 3. Feedback Forms Section */}
        <section aria-label="Recent Feedback Forms" style={{ marginBottom: '28px' }}>
          <RecentFormsTable
            forms={dashboardData?.recent_forms || []}
            onDeleteForm={handleDeleteForm}
            isLoading={isLoading && !dashboardData}
            searchQuery={searchQuery}
          />
        </section>

        {/* 4. Recent Responses Section */}
        <section aria-label="Recent Customer Responses" style={{ marginBottom: '28px' }}>
          <RecentResponsesTable
            responses={dashboardData?.recent_responses || []}
            isLoading={isLoading && !dashboardData}
          />
        </section>
      </div>
    </DashboardLayout>
  );
}
