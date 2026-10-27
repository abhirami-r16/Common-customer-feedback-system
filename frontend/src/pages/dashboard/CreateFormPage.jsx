import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Send,
  Plus,
  Trash2,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  Layers,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Share2,
  ExternalLink,
  Star,
  Settings,
  GripVertical,
  X,
  User
} from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ShareFormModal from '../../components/dashboard/ShareFormModal';
import { formBuilderService } from '../../services/api';

// Supported Question Types
const QUESTION_TYPES = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'star_rating', label: 'Star Rating (1–5 stars)' },
  { value: 'numeric_rating', label: 'Numeric Rating' },
  { value: 'multiple_choice', label: 'Multiple Choice (single answer)' },
  { value: 'checkboxes', label: 'Checkboxes (multiple answers)' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'yes_no', label: 'Yes / No' },
  { value: 'email', label: 'Email' },
  { value: 'date', label: 'Date' },
];

export default function CreateFormPage() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = paramId || searchParams.get('edit');

  // Form State
  const [form, setForm] = useState({
    id: null,
    title: '',
    description: '',
    status: 'draft',
    slug: '',
    sections: [
      {
        id: `sec-${Date.now()}`,
        title: 'General Feedback',
        description: 'Please help us improve our services by answering the questions below.',
        position: 0,
        questions: [],
      },
    ],
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Interactive Live Preview Mock State
  const [previewAnswers, setPreviewAnswers] = useState({});

  // Load existing form if editId is provided
  useEffect(() => {
    if (editId) {
      loadExistingForm(editId);
    }
  }, [editId]);

  const loadExistingForm = async (id) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await formBuilderService.getForm(id);
      const data = res.data?.form || res.data?.data || res.data;
      if (data) {
        let loadedSections = (data.sections && data.sections.length > 0)
          ? data.sections.map((s, sIdx) => ({
              id: s.id,
              title: s.title || '',
              description: s.description || '',
              position: sIdx,
              questions: (s.questions || []).map((q, qIdx) => ({
                id: q.id,
                question_text: q.question_text || '',
                question_type: q.question_type || 'short_text',
                is_required: !!q.is_required,
                settings: q.settings || {},
                position: qIdx,
                options: (q.options || []).map((o, oIdx) => ({
                  id: o.id,
                  option_text: o.option_text || '',
                  position: oIdx,
                })),
              })),
            }))
          : [
              {
                id: `sec-${Date.now()}`,
                title: 'General Feedback',
                description: '',
                position: 0,
                questions: [],
              },
            ];

        if (searchParams.get('add') === 'question') {
          const sIdx = loadedSections.length - 1;
          const newQ = {
            id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            question_text: '',
            question_type: 'short_text',
            is_required: false,
            settings: {},
            position: loadedSections[sIdx].questions.length,
            options: [],
          };
          loadedSections[sIdx] = {
            ...loadedSections[sIdx],
            questions: [...loadedSections[sIdx].questions, newQ],
          };
          setTimeout(() => {
            const el = document.getElementById(`question-card-${newQ.id}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              const input = el.querySelector('input.form-input');
              if (input) input.focus();
            } else {
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }
          }, 350);
        }

        setForm({
          id: data.id,
          title: data.title || '',
          description: data.description || '',
          status: data.status || 'draft',
          slug: data.slug || '',
          sections: loadedSections,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load form for editing.');
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // Section Management
  // -------------------------------------------------------------
  const handleAddSection = () => {
    const newSection = {
      id: `sec-${Date.now()}`,
      title: `Section ${form.sections.length + 1}`,
      description: '',
      position: form.sections.length,
      questions: [],
    };
    setForm((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const handleUpdateSection = (sectionIndex, field, value) => {
    setForm((prev) => {
      const updated = [...prev.sections];
      updated[sectionIndex] = { ...updated[sectionIndex], [field]: value };
      return { ...prev, sections: updated };
    });
  };

  const handleDeleteSection = (sectionIndex) => {
    if (form.sections.length <= 1) {
      alert('A form must have at least one section.');
      return;
    }
    const sectionTitle = form.sections[sectionIndex].title || 'this section';
    if (!window.confirm(`Are you sure you want to delete "${sectionTitle}" and all of its questions?`)) {
      return;
    }

    setForm((prev) => {
      const updated = prev.sections.filter((_, idx) => idx !== sectionIndex)
        .map((s, idx) => ({ ...s, position: idx }));
      return { ...prev, sections: updated };
    });
  };

  const handleMoveSection = (sectionIndex, direction) => {
    const targetIndex = sectionIndex + direction;
    if (targetIndex < 0 || targetIndex >= form.sections.length) return;

    setForm((prev) => {
      const updated = [...prev.sections];
      const temp = updated[sectionIndex];
      updated[sectionIndex] = updated[targetIndex];
      updated[targetIndex] = temp;
      return {
        ...prev,
        sections: updated.map((s, idx) => ({ ...s, position: idx })),
      };
    });
  };

  // -------------------------------------------------------------
  // Question Management
  // -------------------------------------------------------------
  const handleAddQuestion = (sectionIndex = 0) => {
    const newQuestion = {
      id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      question_text: '',
      question_type: 'short_text',
      is_required: false,
      settings: {},
      position: (form.sections[sectionIndex]?.questions?.length) || 0,
      options: [],
    };

    setForm((prev) => {
      let updatedSections = [...prev.sections];
      if (updatedSections.length === 0) {
        updatedSections = [{
          id: `sec-${Date.now()}`,
          title: prev.title || 'General',
          description: '',
          position: 0,
          questions: [],
        }];
      }
      const sIdx = Math.min(sectionIndex, updatedSections.length - 1);
      updatedSections[sIdx] = {
        ...updatedSections[sIdx],
        questions: [...updatedSections[sIdx].questions, newQuestion],
      };
      return { ...prev, sections: updatedSections };
    });

    // Automatically scroll down and focus the newly created question
    setTimeout(() => {
      const el = document.getElementById(`question-card-${newQuestion.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = el.querySelector('input.form-input');
        if (input) {
          input.focus();
        }
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    }, 120);
  };

  const handleUpdateQuestion = (sectionIndex, questionIndex, field, value) => {
    setForm((prev) => {
      const updatedSections = [...prev.sections];
      const currentQuestions = [...updatedSections[sectionIndex].questions];
      const currentQ = { ...currentQuestions[questionIndex] };

      if (field === 'question_type') {
        currentQ.question_type = value;
        // If type changed to choice-based and has no options, initialize with default options
        if (['multiple_choice', 'checkboxes', 'dropdown'].includes(value) && (!currentQ.options || currentQ.options.length === 0)) {
          currentQ.options = [
            { id: `opt-${Date.now()}-1`, option_text: 'Option 1', position: 0 },
            { id: `opt-${Date.now()}-2`, option_text: 'Option 2', position: 1 },
          ];
        } else if (value === 'star_rating') {
          currentQ.settings = { max_rating: 5, ...currentQ.settings };
        } else if (value === 'numeric_rating') {
          currentQ.settings = { scale_min: 1, scale_max: 10, ...currentQ.settings };
        }
      } else if (field === 'settings') {
        currentQ.settings = { ...currentQ.settings, ...value };
      } else {
        currentQ[field] = value;
      }

      currentQuestions[questionIndex] = currentQ;
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        questions: currentQuestions,
      };
      return { ...prev, sections: updatedSections };
    });
  };

  const handleDuplicateQuestion = (sectionIndex, questionIndex) => {
    const original = form.sections[sectionIndex].questions[questionIndex];
    const duplicated = {
      ...JSON.parse(JSON.stringify(original)),
      id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      question_text: `${original.question_text} (Copy)`,
      options: (original.options || []).map((opt) => ({
        ...opt,
        id: `opt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      })),
    };

    setForm((prev) => {
      const updatedSections = [...prev.sections];
      const questions = [...updatedSections[sectionIndex].questions];
      questions.splice(questionIndex + 1, 0, duplicated);
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        questions: questions.map((q, idx) => ({ ...q, position: idx })),
      };
      return { ...prev, sections: updatedSections };
    });
  };

  const handleDeleteQuestion = (sectionIndex, questionIndex) => {
    const qText = form.sections[sectionIndex].questions[questionIndex].question_text || 'this question';
    if (!window.confirm(`Delete "${qText}"?`)) return;

    setForm((prev) => {
      const updatedSections = [...prev.sections];
      const filtered = updatedSections[sectionIndex].questions.filter((_, idx) => idx !== questionIndex)
        .map((q, idx) => ({ ...q, position: idx }));
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        questions: filtered,
      };
      return { ...prev, sections: updatedSections };
    });
  };

  const handleMoveQuestion = (sectionIndex, questionIndex, direction) => {
    const targetIndex = questionIndex + direction;
    const questions = form.sections[sectionIndex].questions;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    setForm((prev) => {
      const updatedSections = [...prev.sections];
      const updatedQ = [...updatedSections[sectionIndex].questions];
      const temp = updatedQ[questionIndex];
      updatedQ[questionIndex] = updatedQ[targetIndex];
      updatedQ[targetIndex] = temp;

      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        questions: updatedQ.map((q, idx) => ({ ...q, position: idx })),
      };
      return { ...prev, sections: updatedSections };
    });
  };

  // -------------------------------------------------------------
  // Custom Options Management
  // -------------------------------------------------------------
  const handleAddOption = (sectionIndex, questionIndex) => {
    const currentOptions = form.sections[sectionIndex].questions[questionIndex].options || [];
    const newOption = {
      id: `opt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      option_text: `Option ${currentOptions.length + 1}`,
      position: currentOptions.length,
    };

    setForm((prev) => {
      const updatedSections = [...prev.sections];
      const questions = [...updatedSections[sectionIndex].questions];
      const targetQ = { ...questions[questionIndex] };
      targetQ.options = [...(targetQ.options || []), newOption];
      questions[questionIndex] = targetQ;
      updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], questions };
      return { ...prev, sections: updatedSections };
    });
  };

  const handleUpdateOption = (sectionIndex, questionIndex, optionIndex, text) => {
    setForm((prev) => {
      const updatedSections = [...prev.sections];
      const questions = [...updatedSections[sectionIndex].questions];
      const targetQ = { ...questions[questionIndex] };
      const options = [...targetQ.options];
      options[optionIndex] = { ...options[optionIndex], option_text: text };
      targetQ.options = options;
      questions[questionIndex] = targetQ;
      updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], questions };
      return { ...prev, sections: updatedSections };
    });
  };

  const handleDeleteOption = (sectionIndex, questionIndex, optionIndex) => {
    setForm((prev) => {
      const updatedSections = [...prev.sections];
      const questions = [...updatedSections[sectionIndex].questions];
      const targetQ = { ...questions[questionIndex] };
      const options = targetQ.options.filter((_, idx) => idx !== optionIndex)
        .map((o, idx) => ({ ...o, position: idx }));
      targetQ.options = options;
      questions[questionIndex] = targetQ;
      updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], questions };
      return { ...prev, sections: updatedSections };
    });
  };

  const handleMoveOption = (sectionIndex, questionIndex, optionIndex, direction) => {
    const targetIndex = optionIndex + direction;
    const options = form.sections[sectionIndex].questions[questionIndex].options;
    if (targetIndex < 0 || targetIndex >= options.length) return;

    setForm((prev) => {
      const updatedSections = [...prev.sections];
      const questions = [...updatedSections[sectionIndex].questions];
      const targetQ = { ...questions[questionIndex] };
      const updatedOpt = [...targetQ.options];
      const temp = updatedOpt[optionIndex];
      updatedOpt[optionIndex] = updatedOpt[targetIndex];
      updatedOpt[targetIndex] = temp;
      targetQ.options = updatedOpt.map((o, idx) => ({ ...o, position: idx }));
      questions[questionIndex] = targetQ;
      updatedSections[sectionIndex] = { ...updatedSections[sectionIndex], questions };
      return { ...prev, sections: updatedSections };
    });
  };

  // -------------------------------------------------------------
  // Validation, Save, and Publish
  // -------------------------------------------------------------
  const validateForm = (isPublishing = false) => {
    if (!form.title.trim()) {
      return 'Form title is required.';
    }

    if (form.sections.length === 0) {
      return 'Form must contain at least one section.';
    }

    for (let sIdx = 0; sIdx < form.sections.length; sIdx++) {
      const section = form.sections[sIdx];

      for (let qIdx = 0; qIdx < section.questions.length; qIdx++) {
        const q = section.questions[qIdx];
        if (!q.question_text.trim()) {
          return `Question ${qIdx + 1} requires question text.`;
        }

        if (['multiple_choice', 'checkboxes', 'dropdown'].includes(q.question_type)) {
          const validOptions = (q.options || []).filter((o) => o.option_text && o.option_text.trim() !== '');
          if (validOptions.length === 0) {
            return `Question "${q.question_text}" requires at least one answer option.`;
          }

          // Check for duplicate options
          const optionTexts = validOptions.map((o) => o.option_text.trim().toLowerCase());
          const hasDuplicates = new Set(optionTexts).size !== optionTexts.length;
          if (hasDuplicates) {
            return `Question "${q.question_text}" contains duplicate answer options. Please make each option unique.`;
          }
        }
      }
    }

    return null;
  };

  const handleSaveForm = async (targetStatus) => {
    setError(null);
    setSuccessMsg(null);

    const validationError = validateForm(targetStatus === 'published');
    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSaving(true);

    const payload = {
      id: form.id,
      title: form.title,
      description: form.description,
      status: targetStatus || form.status,
      sections: form.sections.map((s, sIdx) => ({
        id: typeof s.id === 'number' ? s.id : null,
        title: s.title?.trim() || form.title?.trim() || 'General',
        description: s.description || '',
        position: sIdx,
        questions: s.questions.map((q, qIdx) => ({
          id: typeof q.id === 'number' ? q.id : null,
          question_text: q.question_text,
          question_type: q.question_type,
          is_required: !!q.is_required,
          settings: q.settings || {},
          position: qIdx,
          options: (q.options || []).map((o, oIdx) => ({
            id: typeof o.id === 'number' ? o.id : null,
            option_text: o.option_text,
            position: oIdx,
          })),
        })),
      })),
    };

    try {
      const res = await formBuilderService.saveForm(payload);
      const savedData = res.data?.form || res.data?.data || res.data;

      if (!savedData || !savedData.id) {
        throw new Error('Server returned an invalid form response.');
      }

      // Update state with persisted database IDs and slug
      setForm((prev) => ({
        ...prev,
        id: savedData.id,
        status: savedData.status,
        slug: savedData.slug,
        sections: savedData.sections.map((s, sIdx) => ({
          id: s.id,
          title: s.title,
          description: s.description || '',
          position: sIdx,
          questions: (s.questions || []).map((q, qIdx) => ({
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            is_required: !!q.is_required,
            settings: q.settings || {},
            position: qIdx,
            options: (q.options || []).map((o, oIdx) => ({
              id: o.id,
              option_text: o.option_text,
              position: oIdx,
            })),
          })),
        })),
      }));

      // Update query params if this was a new form
      if (!editId && savedData.id) {
        setSearchParams({ edit: savedData.id });
      }

      const successText = form.id
        ? 'Form changes saved successfully!'
        : (targetStatus === 'published' ? 'Form created and published successfully!' : 'Form saved as draft successfully!');
      setSuccessMsg(successText);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save form. Please check your connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (form.status === 'published') {
      // Unpublish
      try {
        setIsSaving(true);
        await formBuilderService.updateStatus(form.id, 'unpublished');
        setForm((prev) => ({ ...prev, status: 'unpublished' }));
        setSuccessMsg('Form has been unpublished. Submissions are now paused.');
        setTimeout(() => setSuccessMsg(null), 4000);
      } catch (err) {
        setError(err.message || 'Failed to unpublish form.');
      } finally {
        setIsSaving(false);
      }
    } else {
      // Publish
      handleSaveForm('published');
    }
  };

  const getShareUrl = () => {
    if (!form.slug) return `${window.location.origin}/f/feedback`;
    return `${window.location.origin}/f/${form.slug}`;
  };

  const handleCopyShareLink = () => {
    const url = getShareUrl();
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShare = async () => {
    setError(null);
    setSuccessMsg(null);

    const validationError = validateForm(true);
    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSaving(true);

    const payload = {
      id: form.id,
      title: form.title,
      description: form.description,
      status: 'published',
      sections: form.sections.map((s, sIdx) => ({
        id: typeof s.id === 'number' ? s.id : null,
        title: s.title?.trim() || form.title?.trim() || 'General',
        description: s.description || '',
        position: sIdx,
        questions: s.questions.map((q, qIdx) => ({
          id: typeof q.id === 'number' ? q.id : null,
          question_text: q.question_text,
          question_type: q.question_type,
          is_required: !!q.is_required,
          settings: q.settings || {},
          position: qIdx,
          options: (q.options || []).map((o, oIdx) => ({
            id: typeof o.id === 'number' ? o.id : null,
            option_text: o.option_text,
            position: oIdx,
          })),
        })),
      })),
    };

    try {
      const res = await formBuilderService.saveForm(payload);
      const savedData = res.data?.form || res.data?.data || res.data;

      if (!savedData || !savedData.id) {
        throw new Error('Server returned an invalid form response.');
      }

      setForm((prev) => ({
        ...prev,
        id: savedData.id,
        status: 'published',
        slug: savedData.slug,
        sections: savedData.sections.map((s, sIdx) => ({
          id: s.id,
          title: s.title,
          description: s.description || '',
          position: sIdx,
          questions: (s.questions || []).map((q, qIdx) => ({
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            is_required: !!q.is_required,
            settings: q.settings || {},
            position: qIdx,
            options: (q.options || []).map((o, oIdx) => ({
              id: o.id,
              option_text: o.option_text,
              position: oIdx,
            })),
          })),
        })),
      }));

      if (!editId && savedData.id) {
        setSearchParams({ edit: savedData.id });
      }

      // Automatically copy share link to clipboard
      const publicUrl = `${window.location.origin}/f/${savedData.slug}`;
      try {
        await navigator.clipboard.writeText(publicUrl);
        setCopiedLink(true);
      } catch (e) {
        console.warn('Clipboard write error', e);
      }

      setShowShareModal(true);
      setSuccessMsg('Form published successfully! Share link copied to clipboard.');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save and share form. Please check your connection.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="dashboard-page-container">
        {/* Top Navigation & Status Bar */}
        <div className="builder-layout">
          <div className="builder-header-card">
            <div className="builder-topbar">
              <div className="builder-title-badge-group">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate('/dashboard/forms')}
                >
                  <ArrowLeft size={15} />
                  <span>Back to Forms</span>
                </button>
                <h2 style={{ fontSize: '1.45rem', margin: 0 }}>
                  {form.id ? 'Edit Feedback Form' : 'Create Feedback Form'}
                </h2>
                <span className={`status-pill status-${form.status}`}>
                  {form.status.toUpperCase()}
                </span>
              </div>

              <div className="builder-actions-group">
                {/* Add Question Button */}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleAddQuestion(0)}
                  style={{ gap: '8px', padding: '10px 20px', fontSize: '0.95rem', fontWeight: 600 }}
                >
                  <Plus size={16} />
                  <span>Add Question</span>
                </button>
              </div>
            </div>

            {/* Notification Alerts */}
            {error && (
              <div className="alert alert-danger" style={{ margin: 0 }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="alert alert-success" style={{ margin: 0 }}>
                <CheckCircle2 size={18} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form Meta Fields */}
            <div className="builder-form-meta">
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="builder-form-title">
                  Form Title <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  id="builder-form-title"
                  type="text"
                  className="form-input"
                  style={{ fontSize: '1.15rem', fontWeight: 600 }}
                  placeholder="e.g. Customer Satisfaction Survey 2026, Product Feedback"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="builder-form-desc">
                  Description / Welcome Message (Optional)
                </label>
                <textarea
                  id="builder-form-desc"
                  className="form-input"
                  rows={2}
                  placeholder="Tell your customers the goal of this questionnaire and how their feedback helps..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Builder & Live Preview Grid */}
          <div className={`builder-main-grid ${showPreview ? 'with-preview' : ''}`}>
            {/* Left: Sections & Questions Builder */}
            <div className="builder-left-col">
              {isLoading ? (
                <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
                  <div className="spinner spinner-primary" style={{ margin: '0 auto 16px' }} />
                  <p style={{ color: 'var(--text-muted)' }}>Loading form structure...</p>
                </div>
              ) : (
                <>
                  {form.sections.map((section, sIdx) => (
                    <div key={section.id} className="builder-section-card">
                      {/* Question Cards in Section */}
                      <div className="builder-questions-list">
                        {section.questions.length === 0 ? (
                          <div style={{
                            padding: '28px',
                            textAlign: 'center',
                            border: '1px dashed var(--border-light)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '16px',
                            backgroundColor: '#fafbfc'
                          }}>
                            <HelpCircle size={24} color="var(--text-dim)" style={{ marginBottom: '6px' }} />
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                              This section has no questions yet. Click "+ Add Question" below.
                            </p>
                          </div>
                        ) : (
                          section.questions.map((q, qIdx) => (
                            <div key={q.id} id={`question-card-${q.id}`} className="builder-question-card">
                              {/* Question Top Row: Badge & Reorder / Actions */}
                              <div className="question-header-row">
                                <span className="question-index-tag">Question {qIdx + 1}</span>
                                <div className="question-row-actions">
                                  <button
                                    type="button"
                                    className="builder-icon-btn"
                                    title="Move Question Up"
                                    disabled={qIdx === 0}
                                    onClick={() => handleMoveQuestion(sIdx, qIdx, -1)}
                                  >
                                    <ChevronUp size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="builder-icon-btn"
                                    title="Move Question Down"
                                    disabled={qIdx === section.questions.length - 1}
                                    onClick={() => handleMoveQuestion(sIdx, qIdx, 1)}
                                  >
                                    <ChevronDown size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="builder-icon-btn"
                                    title="Duplicate Question"
                                    onClick={() => handleDuplicateQuestion(sIdx, qIdx)}
                                  >
                                    <Copy size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="builder-icon-btn btn-danger"
                                    title="Delete Question"
                                    onClick={() => handleDeleteQuestion(sIdx, qIdx)}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              {/* Question Main Inputs Grid */}
                              <div className="question-inputs-grid">
                                <div>
                                  <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter question text (e.g. How satisfied are you?)"
                                    value={q.question_text}
                                    onChange={(e) => handleUpdateQuestion(sIdx, qIdx, 'question_text', e.target.value)}
                                  />
                                </div>

                                <div>
                                  <select
                                    className="form-input"
                                    value={q.question_type}
                                    onChange={(e) => handleUpdateQuestion(sIdx, qIdx, 'question_type', e.target.value)}
                                  >
                                    {QUESTION_TYPES.map((t) => (
                                      <option key={t.value} value={t.value}>
                                        {t.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label
                                    className="checkbox-label"
                                    style={{
                                      fontSize: '0.86rem',
                                      userSelect: 'none',
                                      padding: '8px 12px',
                                      background: q.is_required ? 'var(--primary-light)' : 'var(--bg-subtle)',
                                      borderRadius: 'var(--radius-sm)',
                                      border: '1px solid var(--border-light)',
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={q.is_required}
                                      onChange={(e) => handleUpdateQuestion(sIdx, qIdx, 'is_required', e.target.checked)}
                                    />
                                    <span>Required</span>
                                  </label>
                                </div>
                              </div>

                              {/* Type-Specific Settings & Custom Options Editor */}
                              {/* 1. Multiple Choice / Checkboxes / Dropdown */}
                              {['multiple_choice', 'checkboxes', 'dropdown'].includes(q.question_type) && (
                                <div className="question-settings-panel">
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                      Answer Options ({q.options ? q.options.length : 0})
                                    </span>
                                    {(!q.options || q.options.length === 0) && (
                                      <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}>
                                        * At least 1 option required
                                      </span>
                                    )}
                                  </div>

                                  <div className="options-list-editor">
                                    {(q.options || []).map((opt, oIdx) => (
                                      <div key={opt.id} className="option-row-item">
                                        <div className="option-row-input-group">
                                          <span className="option-drag-indicator">#{oIdx + 1}</span>
                                          <input
                                            type="text"
                                            className="form-input option-input-field"
                                            placeholder={`Option ${oIdx + 1} text`}
                                            value={opt.option_text}
                                            onChange={(e) => handleUpdateOption(sIdx, qIdx, oIdx, e.target.value)}
                                          />
                                        </div>
                                        <div className="option-row-actions">
                                          <button
                                            type="button"
                                            className="builder-icon-btn"
                                            title="Move Option Up"
                                            disabled={oIdx === 0}
                                            onClick={() => handleMoveOption(sIdx, qIdx, oIdx, -1)}
                                          >
                                            <ChevronUp size={13} />
                                          </button>
                                          <button
                                            type="button"
                                            className="builder-icon-btn"
                                            title="Move Option Down"
                                            disabled={oIdx === q.options.length - 1}
                                            onClick={() => handleMoveOption(sIdx, qIdx, oIdx, 1)}
                                          >
                                            <ChevronDown size={13} />
                                          </button>
                                          <button
                                            type="button"
                                            className="builder-icon-btn btn-danger"
                                            title="Delete Option"
                                            onClick={() => handleDeleteOption(sIdx, qIdx, oIdx)}
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <button
                                    type="button"
                                    className="add-option-btn"
                                    onClick={() => handleAddOption(sIdx, qIdx)}
                                  >
                                    <Plus size={14} />
                                    <span>Add Option</span>
                                  </button>
                                </div>
                              )}

                              {/* 2. Star Rating Configuration */}
                              {q.question_type === 'star_rating' && (
                                <div className="question-settings-panel">
                                  <div className="rating-scale-selector">
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Maximum Stars:</span>
                                    {[3, 4, 5].map((stars) => (
                                      <button
                                        key={stars}
                                        type="button"
                                        className={`btn btn-sm ${
                                          (q.settings?.max_rating || 5) === stars ? 'btn-primary' : 'btn-secondary'
                                        }`}
                                        onClick={() => handleUpdateQuestion(sIdx, qIdx, 'settings', { max_rating: stars })}
                                      >
                                        {stars} Stars
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* 3. Numeric Rating Configuration */}
                              {q.question_type === 'numeric_rating' && (
                                <div className="question-settings-panel">
                                  <div className="rating-scale-selector">
                                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Scale Range:</span>
                                    <button
                                      type="button"
                                      className={`btn btn-sm ${
                                        (q.settings?.scale_max || 10) === 5 ? 'btn-primary' : 'btn-secondary'
                                      }`}
                                      onClick={() => handleUpdateQuestion(sIdx, qIdx, 'settings', { scale_min: 1, scale_max: 5 })}
                                    >
                                      1 to 5
                                    </button>
                                    <button
                                      type="button"
                                      className={`btn btn-sm ${
                                        (q.settings?.scale_max || 10) === 10 ? 'btn-primary' : 'btn-secondary'
                                      }`}
                                      onClick={() => handleUpdateQuestion(sIdx, qIdx, 'settings', { scale_min: 1, scale_max: 10 })}
                                    >
                                      1 to 10
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* 4. Yes / No Indicator */}
                              {q.question_type === 'yes_no' && (
                                <div className="question-settings-panel">
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    Predefined customer options: <strong>Yes</strong> / <strong>No</strong>
                                  </span>
                                </div>
                              )}
                            </div>
                          ))
                        )}

                        {/* Save Form / Save Changes Button */}
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            disabled={isSaving}
                            onClick={() => handleSaveForm(form.status || 'published')}
                            style={{
                              gap: '8px',
                              padding: '12px 36px',
                              fontSize: '1rem',
                              fontWeight: 600,
                              minWidth: '200px'
                            }}
                          >
                            <Save size={18} />
                            <span>{isSaving ? 'Saving...' : (form.id ? 'Save Changes' : 'Save Form')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}


                </>
              )}
            </div>

            {/* Right: Live Interactive Preview */}
            {showPreview && (
              <div className="builder-right-col preview-sticky-wrap">
                <div className="live-preview-card">
                  <div className="preview-browser-header">
                    <div className="preview-dot-group">
                      <div className="preview-dot red" />
                      <div className="preview-dot yellow" />
                      <div className="preview-dot green" />
                    </div>
                    <div className="preview-url-bar">
                      https://feedbackhub.app/f/{form.slug || 'live-preview'}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)' }}>
                      LIVE PREVIEW
                    </div>
                  </div>

                  <div className="preview-content-scroll">
                    <div className="preview-form-card">
                      {/* Form Header */}
                      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '1.45rem', marginBottom: '8px', textAlign: 'center' }}>
                          {form.title || 'Untitled Feedback Form'}
                        </h2>
                        {form.description && (
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', margin: 0, textAlign: 'center' }}>
                            {form.description}
                          </p>
                        )}
                      </div>

                      {/* Customer Information (Name & Email) Preview */}
                      <div style={{
                        background: '#f8fafc',
                        padding: '16px',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '24px',
                        border: '1px solid var(--border-light)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '0.9rem', fontWeight: 600 }}>
                          <User size={15} color="var(--primary)" />
                          <span>Your Information</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                              Full Name (Optional)
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder="e.g. John Doe"
                              disabled
                              style={{ background: '#ffffff', fontSize: '0.86rem' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                              Email ID (Optional)
                            </label>
                            <input
                              type="email"
                              className="form-input"
                              placeholder="e.g. john@example.com"
                              disabled
                              style={{ background: '#ffffff', fontSize: '0.86rem' }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sections */}
                      {form.sections.map((section, sIdx) => (
                        <div key={section.id} className="preview-section-block">
                          {form.sections.length > 1 && (
                            <>
                              <h4 style={{ fontSize: '1.1rem', marginBottom: '4px', color: 'var(--primary)' }}>
                                {section.title || `Section ${sIdx + 1}`}
                              </h4>
                              {section.description && (
                                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                                  {section.description}
                                </p>
                              )}
                            </>
                          )}

                          {section.questions.map((q, qIdx) => (
                            <div key={q.id} className="preview-question-block">
                              <label className="preview-question-label">
                                {qIdx + 1}. {q.question_text || 'Untitled Question'}
                                {q.is_required && <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>}
                              </label>

                              {/* Question Input Renderers */}
                              {q.question_type === 'short_text' && (
                                <input
                                  type="text"
                                  className="form-input"
                                  placeholder="Type your answer here..."
                                  value={previewAnswers[q.id] || ''}
                                  onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                                />
                              )}

                              {q.question_type === 'long_text' && (
                                <textarea
                                  className="form-input"
                                  rows={3}
                                  placeholder="Type your detailed response here..."
                                  value={previewAnswers[q.id] || ''}
                                  onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                                />
                              )}

                              {q.question_type === 'email' && (
                                <input
                                  type="email"
                                  className="form-input"
                                  placeholder="name@example.com"
                                  value={previewAnswers[q.id] || ''}
                                  onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                                />
                              )}

                              {q.question_type === 'date' && (
                                <input
                                  type="date"
                                  className="form-input"
                                  value={previewAnswers[q.id] || ''}
                                  onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                                />
                              )}

                              {q.question_type === 'star_rating' && (
                                <div className="preview-star-rating">
                                  {Array.from({ length: q.settings?.max_rating || 5 }).map((_, starIdx) => {
                                    const ratingVal = starIdx + 1;
                                    const active = (previewAnswers[q.id] || 0) >= ratingVal;
                                    return (
                                      <button
                                        key={ratingVal}
                                        type="button"
                                        className={`preview-star-btn ${active ? 'active' : ''}`}
                                        onClick={() => setPreviewAnswers({ ...previewAnswers, [q.id]: ratingVal })}
                                      >
                                        ★
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {q.question_type === 'numeric_rating' && (
                                <div className="preview-numeric-scale">
                                  {Array.from({ length: q.settings?.scale_max || 10 }).map((_, nIdx) => {
                                    const numVal = nIdx + 1;
                                    const active = previewAnswers[q.id] === numVal;
                                    return (
                                      <button
                                        key={numVal}
                                        type="button"
                                        className={`preview-numeric-btn ${active ? 'active' : ''}`}
                                        onClick={() => setPreviewAnswers({ ...previewAnswers, [q.id]: numVal })}
                                      >
                                        {numVal}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {q.question_type === 'multiple_choice' && (
                                <div className="preview-radio-group">
                                  {(q.options || []).map((opt) => (
                                    <label key={opt.id} className="preview-choice-label">
                                      <input
                                        type="radio"
                                        name={`preview-${q.id}`}
                                        checked={previewAnswers[q.id] === opt.option_text}
                                        onChange={() => setPreviewAnswers({ ...previewAnswers, [q.id]: opt.option_text })}
                                      />
                                      <span>{opt.option_text}</span>
                                    </label>
                                  ))}
                                </div>
                              )}

                              {q.question_type === 'checkboxes' && (
                                <div className="preview-checkbox-group">
                                  {(q.options || []).map((opt) => {
                                    const selected = (previewAnswers[q.id] || []).includes(opt.option_text);
                                    return (
                                      <label key={opt.id} className="preview-choice-label">
                                        <input
                                          type="checkbox"
                                          checked={selected}
                                          onChange={(e) => {
                                            const current = previewAnswers[q.id] || [];
                                            const updated = e.target.checked
                                              ? [...current, opt.option_text]
                                              : current.filter((item) => item !== opt.option_text);
                                            setPreviewAnswers({ ...previewAnswers, [q.id]: updated });
                                          }}
                                        />
                                        <span>{opt.option_text}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}

                              {q.question_type === 'dropdown' && (
                                <select
                                  className="form-input"
                                  value={previewAnswers[q.id] || ''}
                                  onChange={(e) => setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })}
                                >
                                  <option value="">-- Select an option --</option>
                                  {(q.options || []).map((opt) => (
                                    <option key={opt.id} value={opt.option_text}>
                                      {opt.option_text}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {q.question_type === 'yes_no' && (
                                <div className="preview-yesno-group">
                                  <button
                                    type="button"
                                    className={`preview-yesno-btn ${previewAnswers[q.id] === 'Yes' ? 'active' : ''}`}
                                    onClick={() => setPreviewAnswers({ ...previewAnswers, [q.id]: 'Yes' })}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    className={`preview-yesno-btn ${previewAnswers[q.id] === 'No' ? 'active' : ''}`}
                                    onClick={() => setPreviewAnswers({ ...previewAnswers, [q.id]: 'No' })}
                                  >
                                    No
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ))}

                      {/* Preview Submit Button */}
                      <div style={{ marginTop: '30px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ width: '100%', padding: '12px' }}
                          onClick={() => alert('This is a preview demonstration. Your answers will not be submitted.')}
                        >
                          Submit Feedback
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Unified Share Form Modal */}
        <ShareFormModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          form={form}
        />

        {/* Floating Toast Notification for Immediate Feedback Anywhere on Page */}
        {(successMsg || error) && (
          <div className={`builder-floating-toast ${successMsg ? 'success' : 'danger'}`}>
            {successMsg ? <CheckCircle2 size={20} color="#059669" /> : <AlertCircle size={20} color="#dc2626" />}
            <span style={{ flex: 1 }}>{successMsg || error}</span>
            <button
              type="button"
              onClick={() => { setSuccessMsg(null); setError(null); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                color: 'inherit',
                opacity: 0.7,
                display: 'inline-flex'
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
