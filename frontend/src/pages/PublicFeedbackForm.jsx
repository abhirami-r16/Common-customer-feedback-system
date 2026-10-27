import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Send,
  Sparkles,
  User,
  Mail,
  Star,
  Check,
  ThumbsUp,
  ThumbsDown,
  ShieldCheck,
  Building2,
  RotateCcw,
} from 'lucide-react';
import { formBuilderService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PublicFeedbackForm() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { user, isAdmin } = useAuth();
  const isPreview = searchParams.get('preview') === 'true' || searchParams.get('mode') === 'admin' || isAdmin;

  const [form, setForm] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [answers, setAnswers] = useState({});
  const [hoverRatings, setHoverRatings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const getClientToken = () => {
    let token = localStorage.getItem('feedback_client_token');
    if (!token) {
      token = 'usr_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
      localStorage.setItem('feedback_client_token', token);
    }
    return token;
  };

  useEffect(() => {
    loadPublicForm();
  }, [slug, isPreview]);

  const loadPublicForm = async () => {
    setIsLoading(true);
    setError(null);
    const token = getClientToken();

    // Check if current user has already submitted this form in this browser (skip if preview/admin)
    if (!isPreview && localStorage.getItem(`submitted_form_${slug}`)) {
      setSubmitted(true);
    }

    try {
      const res = await formBuilderService.getPublicForm(slug, { client_token: token });
      const data = res.data?.form || res.data?.data || res.data;
      setForm(data);
      if (!isPreview && data?.already_submitted) {
        setSubmitted(true);
        localStorage.setItem(`submitted_form_${slug}`, 'true');
      }
    } catch (err) {
      setError(err.message || 'This feedback form is not currently available.');
    } finally {
      setIsLoading(false);
    }
  };

  // Flatten all questions for progress calculation
  const allQuestions = useMemo(() => {
    if (!form?.sections) return [];
    return form.sections.flatMap((s) => s.questions || []);
  }, [form]);

  // Count answered questions
  const answeredCount = useMemo(() => {
    return allQuestions.filter((q) => {
      const val = answers[q.id];
      if (val === undefined || val === null || val === '') return false;
      if (Array.isArray(val) && val.length === 0) return false;
      return true;
    }).length;
  }, [allQuestions, answers]);

  const progressPct = allQuestions.length > 0
    ? Math.round((answeredCount / allQuestions.length) * 100)
    : 0;

  const handleTextChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const handleCheckboxToggle = (questionId, optionText) => {
    setAnswers((prev) => {
      const current = prev[questionId] || [];
      const updated = current.includes(optionText)
        ? current.filter((item) => item !== optionText)
        : [...current, optionText];
      return { ...prev, [questionId]: updated };
    });
    if (validationErrors[questionId]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const getStarSentiment = (rating) => {
    switch (rating) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form) return;

    // Validate required fields
    const newErrors = {};
    (form.sections || []).forEach((sec) => {
      (sec.questions || []).forEach((q) => {
        if (q.is_required) {
          const answer = answers[q.id];
          if (
            answer === undefined ||
            answer === null ||
            answer === '' ||
            (Array.isArray(answer) && answer.length === 0)
          ) {
            newErrors[q.id] = 'This question requires an answer before submitting.';
          }
        }
      });
    });

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    const token = getClientToken();
    try {
      await formBuilderService.submitFeedback(slug, {
        customer_name: customerName.trim() || undefined,
        customer_email: customerEmail.trim() || undefined,
        answers,
        client_token: token,
      });
      localStorage.setItem(`submitted_form_${slug}`, 'true');
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err.already_submitted || err.message?.includes('already submitted')) {
        localStorage.setItem(`submitted_form_${slug}`, 'true');
        setSubmitted(true);
      } else {
        setError(err.message || 'Failed to submit feedback. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="public-form-viewport">
        <div className="public-status-card" style={{ maxWidth: '420px', padding: '60px 24px' }}>
          <div className="spinner spinner-primary" style={{ margin: '0 auto 18px', width: '38px', height: '38px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Loading Feedback Form
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Preparing your survey experience...</p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="public-form-viewport">
        <div className="public-status-card">
          <div className="status-icon-circle error">
            <AlertCircle size={40} />
          </div>
          <h2 className="status-card-title">Form Unavailable</h2>
          <p className="status-card-desc">
            {error || 'The requested feedback questionnaire is either unpublished, private, or does not exist.'}
          </p>
          <Link to="/" className="status-action-btn">
            <ArrowLeft size={16} />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="public-form-viewport">
        <div className="public-status-card">
          <div className="status-icon-circle success">
            <CheckCircle2 size={44} />
          </div>
          <div className="public-brand-pill" style={{ marginBottom: '16px' }}>
            <Sparkles size={14} className="sparkle-icon" />
            <span>{form?.user?.business_name || 'Feedback Submitted'}</span>
          </div>
          <h2 className="status-card-title">Thank You For Your Feedback!</h2>
          <p className="status-card-desc">
            Your response has been securely recorded for <strong>{form?.user?.business_name || 'our team'}</strong>.
            Each customer can submit a response only once to ensure authentic and reliable feedback.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
            <span
              style={{
                fontSize: '0.9rem',
                color: '#065f46',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                padding: '8px 20px',
                borderRadius: '24px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={16} color="#059669" />
              <span>Response successfully recorded</span>
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '22px' }}>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(`submitted_form_${slug}`);
                setSubmitted(false);
              }}
              className="btn btn-primary"
              style={{
                padding: '0.65rem 1.4rem',
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#1B906F',
                borderColor: '#1B906F',
                color: '#ffffff',
                fontWeight: 600,
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={16} />
              <span>View Form Questions</span>
            </button>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Review the questions in this feedback questionnaire
            </span>
          </div>
          <div className="public-footer-badge" style={{ marginTop: '36px' }}>
            Powered by <strong>FeedbackHub</strong> • Secure & Confidential
          </div>
        </div>
      </div>
    );
  }

  // Count overall questions for numbering
  let globalQuestionIndex = 0;

  return (
    <div className="public-form-viewport">
      <div className="public-form-shell">
        {/* Top Gradient Stripe */}
        <div className="public-form-top-accent" />

        <div className="public-form-body">
          {/* Admin Live Form Indicator Banner */}
          {isPreview && (
            <div style={{
              background: 'rgba(27, 144, 111, 0.08)',
              border: '1px solid rgba(27, 144, 111, 0.25)',
              borderRadius: '10px',
              padding: '10px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#081B43', fontWeight: 600 }}>
                <ShieldCheck size={17} style={{ color: '#1B906F' }} />
                <span>Admin Live View • Form Questions Active</span>
              </div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                background: '#1B906F',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '12px',
                letterSpacing: '0.04em'
              }}>
                QUESTIONS ACTIVE
              </span>
            </div>
          )}

          {/* Header & Branding */}
          <header className="public-form-header">
            <div className="public-brand-pill">
              <Sparkles size={14} className="sparkle-icon" />
              <span>{form.user?.business_name || 'Customer Feedback'}</span>
            </div>
            <h1 className="public-form-title">{form.title}</h1>
            {form.description && (
              <p className="public-form-desc">{form.description}</p>
            )}
          </header>

          {/* Dynamic Live Completion Progress */}
          {allQuestions.length > 0 && (
            <div className="public-progress-container">
              <div className="public-progress-meta">
                <span className="public-progress-label">
                  <CheckCircle2 size={15} color={progressPct === 100 ? '#10b981' : '#4f46e5'} />
                  <span>
                    {progressPct === 100
                      ? 'All questions completed! Ready to submit'
                      : `${answeredCount} of ${allQuestions.length} answered`}
                  </span>
                </span>
                <span className="public-progress-pct">{progressPct}%</span>
              </div>
              <div className="public-progress-track">
                <div className="public-progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Customer Information Card */}
            <div className="public-info-card">
              <div className="public-info-title">
                <div className="public-info-heading">
                  <div className="public-info-icon-badge">
                    <User size={16} />
                  </div>
                  <span>Your Information</span>
                </div>
                <span className="public-info-badge">Optional</span>
              </div>

              <div className="public-info-grid">
                <div className="public-input-field-group">
                  <label className="public-field-label" htmlFor="customer-name">
                    Full Name
                  </label>
                  <div className="public-input-box-wrap">
                    <User size={17} className="public-input-icon" />
                    <input
                      id="customer-name"
                      type="text"
                      className="public-text-input"
                      placeholder="e.g. Alex Johnson"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="public-input-field-group">
                  <label className="public-field-label" htmlFor="customer-email">
                    Email Address
                  </label>
                  <div className="public-input-box-wrap">
                    <Mail size={17} className="public-input-icon" />
                    <input
                      id="customer-email"
                      type="email"
                      className="public-text-input"
                      placeholder="e.g. alex@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Sections & Questions */}
            {(form.sections || []).map((section, sIdx) => (
              <div key={section.id} className="public-section-block">
                {/* Section Header */}
                {(section.title || section.description) && (
                  <div className="public-section-header">
                    {section.title && (
                      <h2 className="public-section-title">
                        {section.title}
                      </h2>
                    )}
                    {section.description && (
                      <p className="public-section-desc">{section.description}</p>
                    )}
                  </div>
                )}

                {/* Questions in Section */}
                {(section.questions || []).map((q) => {
                  globalQuestionIndex += 1;
                  const qNum = globalQuestionIndex;
                  const hasError = !!validationErrors[q.id];

                  return (
                    <div
                      key={q.id}
                      className={`public-question-card ${hasError ? 'has-error' : ''}`}
                    >
                      <div className="public-question-header">
                        <span className="public-question-num">{qNum}</span>
                        <div className="public-question-title-wrap">
                          <label className="public-question-title">
                            {q.question_text}
                            {q.is_required && (
                              <span className="public-required-badge" title="Required">*</span>
                            )}
                          </label>
                        </div>
                      </div>

                      {/* Question Control Types */}

                      {/* 1. Short Text */}
                      {q.question_type === 'short_text' && (
                        <input
                          type="text"
                          className="public-single-input"
                          placeholder="Type your response here..."
                          value={answers[q.id] || ''}
                          onChange={(e) => handleTextChange(q.id, e.target.value)}
                        />
                      )}

                      {/* 2. Long Text */}
                      {q.question_type === 'long_text' && (
                        <textarea
                          className="public-text-area"
                          rows={4}
                          placeholder="Please provide your detailed thoughts, feedback or suggestions..."
                          value={answers[q.id] || ''}
                          onChange={(e) => handleTextChange(q.id, e.target.value)}
                        />
                      )}

                      {/* 3. Email */}
                      {q.question_type === 'email' && (
                        <div className="public-input-box-wrap">
                          <Mail size={17} className="public-input-icon" />
                          <input
                            type="email"
                            className="public-text-input"
                            placeholder="name@example.com"
                            value={answers[q.id] || ''}
                            onChange={(e) => handleTextChange(q.id, e.target.value)}
                          />
                        </div>
                      )}

                      {/* 4. Date */}
                      {q.question_type === 'date' && (
                        <input
                          type="date"
                          className="public-single-input"
                          value={answers[q.id] || ''}
                          onChange={(e) => handleTextChange(q.id, e.target.value)}
                        />
                      )}

                      {/* 5. Star Rating */}
                      {q.question_type === 'star_rating' && (() => {
                        const maxStars = q.settings?.max_rating || 5;
                        const currentVal = answers[q.id] || 0;
                        const hoveredVal = hoverRatings[q.id] || 0;
                        const displayVal = hoveredVal || currentVal;
                        const sentiment = getStarSentiment(displayVal);

                        return (
                          <div className="public-star-rating-box">
                            <div className="public-star-cluster">
                              {Array.from({ length: maxStars }).map((_, starIdx) => {
                                const starVal = starIdx + 1;
                                const isFilled = displayVal >= starVal;

                                return (
                                  <button
                                    key={starVal}
                                    type="button"
                                    className={`public-star-btn ${isFilled ? 'active' : ''}`}
                                    onMouseEnter={() =>
                                      setHoverRatings((prev) => ({ ...prev, [q.id]: starVal }))
                                    }
                                    onMouseLeave={() =>
                                      setHoverRatings((prev) => ({ ...prev, [q.id]: 0 }))
                                    }
                                    onClick={() => handleTextChange(q.id, starVal)}
                                    aria-label={`Rate ${starVal} out of ${maxStars}`}
                                  >
                                    <Star
                                      size={32}
                                      fill={isFilled ? '#f59e0b' : 'none'}
                                      color={isFilled ? '#f59e0b' : '#cbd5e1'}
                                      strokeWidth={1.75}
                                    />
                                  </button>
                                );
                              })}
                            </div>
                            {sentiment && (
                              <div className="public-star-sentiment-badge">
                                {sentiment}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* 6. Numeric Scale (NPS / 1-10) */}
                      {q.question_type === 'numeric_rating' && (() => {
                        const maxScale = q.settings?.scale_max || 10;
                        return (
                          <div className="public-numeric-wrap">
                            <div className="public-numeric-row">
                              {Array.from({ length: maxScale }).map((_, nIdx) => {
                                const val = nIdx + 1;
                                const active = answers[q.id] === val;
                                return (
                                  <button
                                    key={val}
                                    type="button"
                                    className={`public-numeric-pill ${active ? 'active' : ''}`}
                                    onClick={() => handleTextChange(q.id, val)}
                                  >
                                    {val}
                                  </button>
                                );
                              })}
                            </div>
                            <div className="public-numeric-legend">
                              <span>1 — Not at all satisfied</span>
                              <span>{maxScale} — Extremely satisfied</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* 7. Multiple Choice (Single Select) */}
                      {q.question_type === 'multiple_choice' && (
                        <div className="public-choice-group">
                          {(q.options || []).map((opt) => {
                            const isSelected = answers[q.id] === opt.option_text;
                            return (
                              <div
                                key={opt.id}
                                className={`choice-card-tile ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleTextChange(q.id, opt.option_text)}
                                role="radio"
                                aria-checked={isSelected}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === ' ' || e.key === 'Enter') {
                                    e.preventDefault();
                                    handleTextChange(q.id, opt.option_text);
                                  }
                                }}
                              >
                                <div className="choice-radio-indicator">
                                  {isSelected && <div className="choice-radio-inner" />}
                                </div>
                                <span className="choice-text">{opt.option_text}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 8. Checkboxes (Multi Select) */}
                      {q.question_type === 'checkboxes' && (
                        <div className="public-choice-group">
                          {(q.options || []).map((opt) => {
                            const isChecked = (answers[q.id] || []).includes(opt.option_text);
                            return (
                              <div
                                key={opt.id}
                                className={`choice-card-tile ${isChecked ? 'selected' : ''}`}
                                onClick={() => handleCheckboxToggle(q.id, opt.option_text)}
                                role="checkbox"
                                aria-checked={isChecked}
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === ' ' || e.key === 'Enter') {
                                    e.preventDefault();
                                    handleCheckboxToggle(q.id, opt.option_text);
                                  }
                                }}
                              >
                                <div className="choice-checkbox-indicator">
                                  {isChecked && <Check size={14} strokeWidth={3} />}
                                </div>
                                <span className="choice-text">{opt.option_text}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 9. Dropdown */}
                      {q.question_type === 'dropdown' && (
                        <select
                          className="public-select-input"
                          value={answers[q.id] || ''}
                          onChange={(e) => handleTextChange(q.id, e.target.value)}
                        >
                          <option value="">-- Please select an option --</option>
                          {(q.options || []).map((opt) => (
                            <option key={opt.id} value={opt.option_text}>
                              {opt.option_text}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* 10. Yes / No */}
                      {q.question_type === 'yes_no' && (
                        <div className="public-yesno-grid">
                          <button
                            type="button"
                            className={`public-yesno-card yes-btn ${answers[q.id] === 'Yes' ? 'active' : ''}`}
                            onClick={() => handleTextChange(q.id, 'Yes')}
                          >
                            <ThumbsUp size={18} />
                            <span>Yes</span>
                          </button>
                          <button
                            type="button"
                            className={`public-yesno-card no-btn ${answers[q.id] === 'No' ? 'active' : ''}`}
                            onClick={() => handleTextChange(q.id, 'No')}
                          >
                            <ThumbsDown size={18} />
                            <span>No</span>
                          </button>
                        </div>
                      )}

                      {/* Validation Error Message */}
                      {hasError && (
                        <div className="public-error-text">
                          <AlertCircle size={15} />
                          <span>{validationErrors[q.id]}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Submit Action Container */}
            <div className="public-submit-container">
              <button
                type="submit"
                className="public-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner spinner-sm" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#ffffff' }} />
                    <span>Submitting Your Response...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Feedback</span>
                    <Send size={18} />
                  </>
                )}
              </button>

              <div className="public-trust-badge">
                <ShieldCheck size={16} color="#4f46e5" />
                <span>Responses are securely recorded & delivered to {form.user?.business_name || 'the organization'}.</span>
              </div>
            </div>
          </form>

          {/* Footer Branding */}
          <div className="public-footer-badge">
            Powered by <strong>FeedbackHub</strong> • Secure Customer Feedback Platform
          </div>
        </div>
      </div>
    </div>
  );
}
