import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  FileText,
  Star,
  CheckSquare,
  CircleDot,
  ChevronDown,
  Calendar,
  Mail,
  HelpCircle,
  ExternalLink,
  Edit3,
  Plus,
  AlertCircle
} from 'lucide-react';
import { formBuilderService } from '../../services/api';

const QUESTION_TYPE_LABELS = {
  short_text: 'Short Text',
  long_text: 'Long Text',
  star_rating: 'Star Rating (1–5)',
  numeric_rating: 'Numeric Rating',
  multiple_choice: 'Multiple Choice',
  checkboxes: 'Checkboxes',
  dropdown: 'Dropdown',
  yes_no: 'Yes / No',
  email: 'Email',
  date: 'Date',
};

export default function ViewQuestionsModal({ isOpen, onClose, form }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && form?.id) {
      loadFormData(form.id);
    } else {
      setFormData(null);
      setError(null);
    }
  }, [isOpen, form?.id]);

  const loadFormData = async (id) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await formBuilderService.getForm(id);
      const data = res.data?.form || res.data?.data || res.data;
      setFormData(data || form);
    } catch (err) {
      console.error(err);
      setError('Unable to load questions. Please check your connection.');
      setFormData(form);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !form) return null;

  // Extract all questions across sections
  const sections = formData?.sections || form?.sections || [];
  const allQuestions = sections.flatMap((s) => s.questions || []);
  const formTitle = formData?.title || form?.title || 'Feedback Form';
  const formDescription = formData?.description || form?.description;
  const formStatus = formData?.status || form?.status || 'published';
  const formSlug = formData?.slug || form?.slug;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '92%',
          maxHeight: 'min(90vh, 760px)',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.25)',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(79, 70, 229, 0.2)',
                flexShrink: 0,
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  {formTitle}
                </h3>
                <span className={`status-pill status-${formStatus}`} style={{ fontSize: '0.75rem' }}>
                  {formStatus.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Questions in this feedback form ({allQuestions.length})
              </p>
            </div>
          </div>

          <button
            type="button"
            className="builder-icon-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            background: '#f8fafc',
          }}
        >
          {/* Welcome Message / Description if present */}
          {formDescription && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 18px',
                fontSize: '0.92rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
              }}
            >
              <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: '2px' }}>
                Description / Welcome Message:
              </span>
              {formDescription}
            </div>
          )}

          {error && (
            <div className="alert alert-danger" style={{ margin: 0 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div className="spinner spinner-primary" style={{ margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0 }}>
                Loading questions...
              </p>
            </div>
          ) : allQuestions.length === 0 ? (
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-light)',
                padding: '40px 20px',
                textAlign: 'center',
              }}
            >
              <HelpCircle size={32} color="var(--text-dim)" style={{ marginBottom: '8px' }} />
              <h4 style={{ margin: '0 0 6px', fontSize: '1rem', color: 'var(--text-main)' }}>
                No Questions Found
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 16px' }}>
                This form does not contain any questions yet.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onClose();
                  navigate(`/dashboard/forms/create?edit=${form.id}&add=question`);
                }}
              >
                <Plus size={14} />
                <span>Add First Question</span>
              </button>
            </div>
          ) : (
            allQuestions.map((q, idx) => (
              <div
                key={q.id || idx}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px 20px',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Question Header: Number + Type + Required */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color: 'var(--primary)',
                        backgroundColor: 'var(--primary-light)',
                        padding: '3px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      Question {idx + 1}
                    </span>
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        backgroundColor: '#f1f5f9',
                        padding: '3px 8px',
                        borderRadius: '4px',
                      }}
                    >
                      {QUESTION_TYPE_LABELS[q.question_type] || q.question_type}
                    </span>
                  </div>

                  {q.is_required ? (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#dc2626',
                        background: '#fef2f2',
                        border: '1px solid #fee2e2',
                        padding: '2px 7px',
                        borderRadius: '4px',
                      }}
                    >
                      Required *
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                      Optional
                    </span>
                  )}
                </div>

                {/* Question Text */}
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {q.question_text || <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Untitled Question</span>}
                </div>

                {/* Question Type Visual Preview */}
                {/* 1. Short Text / Long Text / Email / Date */}
                {['short_text', 'long_text', 'email', 'date'].includes(q.question_type) && (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px dashed #cbd5e1',
                      borderRadius: 'var(--radius-sm)',
                      padding: q.question_type === 'long_text' ? '18px 14px' : '10px 14px',
                      color: 'var(--text-dim)',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {q.question_type === 'email' && <Mail size={14} />}
                    {q.question_type === 'date' && <Calendar size={14} />}
                    <span>
                      {q.question_type === 'short_text' && 'Respondent text input area (single line)'}
                      {q.question_type === 'long_text' && 'Respondent detailed feedback text area (multi-line)'}
                      {q.question_type === 'email' && 'Respondent valid email address field'}
                      {q.question_type === 'date' && 'Respondent date picker selection'}
                    </span>
                  </div>
                )}

                {/* 2. Star Rating */}
                {q.question_type === 'star_rating' && (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={22}
                        color="#f59e0b"
                        fill="#fef3c7"
                        strokeWidth={1.5}
                      />
                    ))}
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                      (1 to 5 Star Rating Scale)
                    </span>
                  </div>
                )}

                {/* 3. Numeric Rating */}
                {q.question_type === 'numeric_rating' && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <span
                        key={num}
                        style={{
                          width: '32px',
                          height: '32px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px',
                          border: '1px solid var(--border-light)',
                          background: '#ffffff',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          color: 'var(--text-main)',
                        }}
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                )}

                {/* 4. Yes / No */}
                {q.question_type === 'yes_no' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span
                      style={{
                        padding: '6px 18px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-light)',
                        background: '#ffffff',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        color: 'var(--text-main)',
                      }}
                    >
                      Yes
                    </span>
                    <span
                      style={{
                        padding: '6px 18px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-light)',
                        background: '#ffffff',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        color: 'var(--text-main)',
                      }}
                    >
                      No
                    </span>
                  </div>
                )}

                {/* 5. Multiple Choice, Checkboxes, Dropdown */}
                {['multiple_choice', 'checkboxes', 'dropdown'].includes(q.question_type) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
                    {(q.options && q.options.length > 0) ? (
                      q.options.map((opt, oIdx) => (
                        <div
                          key={opt.id || oIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.9rem',
                            color: 'var(--text-main)',
                            padding: '6px 12px',
                            background: '#f8fafc',
                            borderRadius: '6px',
                            border: '1px solid #f1f5f9',
                          }}
                        >
                          {q.question_type === 'multiple_choice' && <CircleDot size={15} color="var(--primary)" />}
                          {q.question_type === 'checkboxes' && <CheckSquare size={15} color="var(--primary)" />}
                          {q.question_type === 'dropdown' && <ChevronDown size={15} color="var(--primary)" />}
                          <span>{opt.option_text}</span>
                        </div>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                        No options configured
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-light)',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {formSlug ? (
            <a
              href={`/f/${formSlug}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.88rem',
                color: 'var(--primary)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <span>Test Public Form</span>
              <ExternalLink size={14} />
            </a>
          ) : <div />}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                onClose();
                navigate(`/dashboard/forms/create?edit=${form.id}&add=question`);
              }}
              style={{ gap: '6px', padding: '8px 16px', fontSize: '0.9rem' }}
            >
              <Plus size={15} />
              <span>Add Question</span>
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onClose();
                navigate(`/dashboard/forms/create?edit=${form.id}`);
              }}
              style={{ gap: '6px', padding: '8px 18px', fontSize: '0.9rem' }}
            >
              <Edit3 size={15} />
              <span>Edit Form</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              style={{ padding: '8px 16px', fontSize: '0.9rem' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
