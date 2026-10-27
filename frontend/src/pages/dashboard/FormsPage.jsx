import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  Search,
  Copy,
  Check,
  Trash2,
  Edit3,
  ExternalLink,
  Share2,
  Eye,
  Plus,
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ShareFormModal from '../../components/dashboard/ShareFormModal';
import ViewQuestionsModal from '../../components/dashboard/ViewQuestionsModal';
import { dashboardService } from '../../services/api';

export default function FormsPage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [shareModalForm, setShareModalForm] = useState(null);
  const [viewQuestionsForm, setViewQuestionsForm] = useState(null);

  const loadForms = async () => {
    setIsLoading(true);
    try {
      const res = await dashboardService.getForms({ search });
      setForms(res.data.data || res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, [search]);


  const handleDelete = async (id, title) => {
    if (window.confirm(`Delete form "${title}"?`)) {
      try {
        await dashboardService.deleteForm(id);
        loadForms();
      } catch (e) {
        alert('Failed to delete form');
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="dashboard-page-container">
        <div className="table-header-row dashboard-page-header">
          <div className="dashboard-page-title-block">
            <h2 className="dashboard-page-title">Feedback Forms</h2>
            <p className="dashboard-page-subtitle">Create, manage, and share your customer feedback questionnaires</p>
          </div>
          <div className="table-header-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => {
                const target = forms.find(f => f.status === 'published') || forms[0];
                setShareModalForm(target || null);
              }}
              disabled={forms.length === 0}
              title="Share feedback form via WhatsApp, Message or Public Link"
            >
              <Share2 size={16} />
              <span>Share Form</span>
            </button>

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

        <div className="card dashboard-table-card">
          <div style={{ marginBottom: '20px', maxWidth: '360px' }}>
            <div className="form-input-wrapper">
              <input
                type="text"
                className="form-input"
                placeholder="Search forms by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="table-loading-wrap">
              <div className="spinner spinner-primary" />
              <span>Loading forms...</span>
            </div>
          ) : forms.length === 0 ? (
            <div className="onboarding-empty-panel">
              <h4>No feedback forms found</h4>
              <p>You haven't created any feedback forms yet, or no forms match your search filter.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate('/dashboard/forms/create')}
              >
                Create Feedback Form
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Responses</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {forms.map((f) => (
                    <tr key={f.id} className="table-data-row">
                      <td>
                        <strong>{f.title}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>/f/{f.slug}</div>
                      </td>
                      <td>
                        <span className={`status-pill status-${f.status}`}>
                          {f.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/forms/${f.id}/responses`)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--primary)',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textDecoration: 'underline'
                          }}
                          title="View responses for this form"
                        >
                          {f.submissions_count || 0}
                        </button>
                      </td>
                      <td>{f.created_at}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions-cell">
                          <button
                            type="button"
                            className="action-btn"
                            title="Share this Form"
                            onClick={() => setShareModalForm(f)}
                          >
                            <Share2 size={14} />
                            <span>Share</span>
                          </button>
                          <button
                            type="button"
                            className="action-btn"
                            title="View Questions"
                            onClick={() => setViewQuestionsForm(f)}
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            className="action-btn"
                            title="Edit in Form Builder"
                            onClick={() => navigate(`/dashboard/forms/create?edit=${f.id}`)}
                          >
                            <Edit3 size={14} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            className="action-btn"
                            title="Add Question to this Form"
                            onClick={() => navigate(`/dashboard/forms/create?edit=${f.id}&add=question`)}
                          >
                            <Plus size={14} />
                            <span>Add Question</span>
                          </button>
                          <button
                            type="button"
                            className="action-btn action-btn-danger"
                            onClick={() => handleDelete(f.id, f.title)}
                            title="Delete form"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Global Share Form Dialog */}
      <ShareFormModal
        isOpen={!!shareModalForm}
        form={shareModalForm}
        forms={forms}
        onClose={() => setShareModalForm(null)}
        onFormStatusChange={loadForms}
      />

      {/* View Form Questions Modal */}
      <ViewQuestionsModal
        isOpen={!!viewQuestionsForm}
        onClose={() => setViewQuestionsForm(null)}
        form={viewQuestionsForm}
      />
    </DashboardLayout>
  );
}
