import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  ExternalLink, 
  Edit3, 
  Copy, 
  Trash2, 
  Check, 
  PlusCircle, 
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Share2,
  Eye,
  Plus
} from 'lucide-react';
import ShareFormModal from './ShareFormModal';
import ViewQuestionsModal from './ViewQuestionsModal';

export default function RecentFormsTable({ forms = [], onDeleteForm, isLoading, searchQuery = '' }) {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [shareModalForm, setShareModalForm] = useState(null);
  const [viewQuestionsForm, setViewQuestionsForm] = useState(null);


  const handleCopyLink = (form) => {
    // Construct real public URL based on current origin
    const publicUrl = `${window.location.origin}/f/${form.slug}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedId(form.id);
    setTimeout(() => setCopiedId(null), 2200);
  };

  const confirmDelete = (form) => {
    if (window.confirm(`Are you sure you want to delete "${form.title}"? All submitted responses will also be removed permanently.`)) {
      setDeletingId(form.id);
      onDeleteForm(form.id).finally(() => setDeletingId(null));
    }
  };

  // Filter forms based on top header search
  const filteredForms = forms.filter((f) =>
    searchQuery ? f.title.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  return (
    <div className="card dashboard-table-card">
      <div className="table-header-row">
        <div>
          <h3 className="section-card-title">Recent Feedback Forms</h3>
          <p className="section-card-subtitle">Manage, share, and track your active customer forms</p>
        </div>

        <Link to="/dashboard/forms" className="view-all-link">
          <span>View All Forms</span>
          <ArrowRight size={15} />
        </Link>
      </div>

      {isLoading ? (
        <div className="table-loading-wrap">
          <div className="spinner spinner-primary" />
          <span>Loading feedback forms...</span>
        </div>
      ) : forms.length === 0 ? (
        /* First-Time User Onboarding Panel */
        <div className="onboarding-empty-panel">
          <div className="onboarding-icon-box">
            <Sparkles size={32} color="var(--primary)" />
          </div>
          <h4>Create your first customer feedback form</h4>
          <p>
            Start collecting genuine insights from your customers in minutes. Customize question types, set ratings, and generate shareable links or QR codes.
          </p>
          <button
            type="button"
            onClick={() => navigate('/dashboard/forms/create')}
            className="btn btn-primary"
            style={{ marginTop: '8px' }}
          >
            <PlusCircle size={17} />
            <span>Create Your First Form</span>
          </button>
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="table-no-results">
          <p>No feedback forms match your search "<strong>{searchQuery}</strong>".</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Form Name</th>
                <th>Status</th>
                <th>Responses</th>
                <th>Created</th>
                <th>Last Response</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredForms.map((form) => {
                const isPublished = form.status === 'published';
                const isCopied = copiedId === form.id;
                const isDeleting = deletingId === form.id;

                return (
                  <tr key={form.id} className="table-data-row">
                    <td>
                      <div className="form-name-cell">
                        <div className="form-icon-circle">
                          <FileText size={16} />
                        </div>
                        <div>
                          <strong className="form-title-text">{form.title}</strong>
                          <span className="form-slug-sub">/f/{form.slug}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`status-pill status-${form.status}`}>
                        {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                      </span>
                    </td>

                    <td>
                      <strong className="table-highlight-num">{form.submissions_count}</strong>
                    </td>

                    <td className="table-date-cell">{form.created_at}</td>

                    <td className="table-date-cell">
                      {form.last_response_at ? (
                        <span>{form.last_response_at}</span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>No responses yet</span>
                      )}
                    </td>

                    <td>
                      <div className="table-actions-cell">
                        {/* View Feedback Form Questions */}
                        <button
                          type="button"
                          className="action-btn"
                          onClick={() => setViewQuestionsForm(form)}
                          title="View questions"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>

                        {/* Edit Form */}
                        <button
                          type="button"
                          className="action-btn"
                          onClick={() => navigate(`/dashboard/forms/create?edit=${form.id}`)}
                          title="Edit form"
                        >
                          <Edit3 size={14} />
                          <span>Edit</span>
                        </button>

                        {/* Add Question to Form */}
                        <button
                          type="button"
                          className="action-btn"
                          onClick={() => navigate(`/dashboard/forms/create?edit=${form.id}&add=question`)}
                          title="Add question to form"
                        >
                          <Plus size={14} />
                          <span>Add Question</span>
                        </button>

                        {/* Delete Form */}
                        <button
                          type="button"
                          className="action-btn action-btn-danger"
                          onClick={() => confirmDelete(form)}
                          disabled={isDeleting}
                          title="Delete form"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Share Form Modal */}
      <ShareFormModal
        isOpen={!!shareModalForm}
        form={shareModalForm}
        forms={forms}
        onClose={() => setShareModalForm(null)}
      />

      {/* View Questions Modal */}
      <ViewQuestionsModal
        isOpen={!!viewQuestionsForm}
        onClose={() => setViewQuestionsForm(null)}
        form={viewQuestionsForm}
      />
    </div>
  );
}
