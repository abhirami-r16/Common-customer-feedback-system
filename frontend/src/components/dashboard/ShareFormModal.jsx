import { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Sparkles,
  MessageSquare,
  QrCode,
  Globe,
  Settings2,
  Info,
} from 'lucide-react';
import {
  getPublicFormUrl,
  generateFeedbackInvitationMessage,
  generateFeedbackInvitationHtml,
} from '../../utils/url';

export const WhatsAppIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ flexShrink: 0 }}
  >
    <path
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.051 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      fill={color}
    />
  </svg>
);

export default function ShareFormModal({ isOpen, onClose, form, forms = [] }) {
  const [selectedForm, setSelectedForm] = useState(form);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [customDomain, setCustomDomain] = useState(() => localStorage.getItem('feedbackhub_custom_domain') || '');
  const [showDomainSettings, setShowDomainSettings] = useState(false);

  useEffect(() => {
    if (form) {
      setSelectedForm(form);
    } else if (forms && forms.length > 0) {
      setSelectedForm(forms[0]);
    }
  }, [form, forms, isOpen]);

  if (!isOpen || !selectedForm) return null;

  // Compute public form URL using either custom domain or current origin
  const defaultUrl = getPublicFormUrl(selectedForm.slug);
  const publicUrl = customDomain.trim()
    ? `${customDomain.trim().replace(/\/+$/, '')}/f/${selectedForm.slug}`
    : defaultUrl;

  const isLocalhost = publicUrl.includes('localhost') || publicUrl.includes('127.0.0.1');
  const plainTextMessage = generateFeedbackInvitationMessage(selectedForm.title, publicUrl);
  const richHtmlMessage = generateFeedbackInvitationHtml(selectedForm.title, publicUrl);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(publicUrl)}`;

  const handleSaveDomain = (val) => {
    setCustomDomain(val);
    if (val.trim()) {
      localStorage.setItem('feedbackhub_custom_domain', val.trim());
    } else {
      localStorage.removeItem('feedbackhub_custom_domain');
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      // Fallback
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyMessage = async () => {
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const plainBlob = new Blob([plainTextMessage], { type: 'text/plain' });
        const htmlBlob = new Blob([richHtmlMessage], { type: 'text/html' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': plainBlob,
            'text/html': htmlBlob,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(plainTextMessage);
      }
    } catch {
      await navigator.clipboard.writeText(plainTextMessage);
    }

    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(plainTextMessage)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container share-form-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px', width: '92%', maxHeight: 'min(92vh, 720px)' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
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
              <Share2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.18rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Share Feedback Form
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                {selectedForm.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close share dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ gap: '16px', padding: '18px 20px' }}>
          {/* Optional Form Selector when multiple forms exist */}
          {forms && forms.length > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Select Form to Share:
              </label>
              <select
                className="form-input"
                style={{ fontSize: '0.9rem', fontWeight: 500 }}
                value={selectedForm.id}
                onChange={(e) => {
                  const target = forms.find((f) => String(f.id) === e.target.value);
                  if (target) setSelectedForm(target);
                }}
              >
                {forms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* WhatsApp Primary Sharing Banner */}
          <div className="whatsapp-share-card">
            <div className="whatsapp-share-info">
              <div className="whatsapp-icon-circle">
                <WhatsAppIcon size={24} color="#ffffff" />
              </div>
              <div>
                <h4 style={{ margin: '0 0 2px', fontSize: '1rem', fontWeight: 700, color: '#064e3b' }}>
                  Share on WhatsApp
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#047857' }}>
                  Sends formatted invitation message with clickable link via WhatsApp
                </p>
              </div>
            </div>
            <button
              type="button"
              className="whatsapp-primary-btn"
              onClick={handleWhatsAppShare}
              title="Share Invitation on WhatsApp"
            >
              <WhatsAppIcon size={18} color="#ffffff" />
              <span>WhatsApp Share</span>
            </button>
          </div>

          {/* Invitation Message Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <MessageSquare size={16} color="var(--primary)" />
                <span>Professional Invitation Message</span>
              </label>
              <button
                type="button"
                className={`btn btn-sm ${copiedMessage ? 'btn-success' : 'btn-secondary'}`}
                onClick={handleCopyMessage}
                style={{ padding: '6px 12px', fontSize: '0.82rem', gap: '5px' }}
                title="Copy message (includes clickable link in rich-text applications)"
              >
                {copiedMessage ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedMessage ? 'Message Copied!' : 'Copy Message'}</span>
              </button>
            </div>

            {/* Formatted Message Preview Card with Active Clickable Hyperlink */}
            <div
              className="share-invitation-message-box"
              style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '12px',
                padding: '12px 14px',
                fontSize: '0.86rem',
                color: '#1e293b',
                lineHeight: 1.5,
                maxHeight: '150px',
                overflowY: 'auto',
                fontFamily: 'inherit',
              }}
            >
              <p style={{ margin: '0 0 10px' }}>Hello! 👋</p>
              <p style={{ margin: '0 0 10px' }}>
                We’d love to hear your feedback on <strong>{selectedForm.title}</strong>!
              </p>
              <p style={{ margin: '0 0 10px' }}>
                Please take a moment to complete our feedback form and share your valuable thoughts. Your feedback will help us improve our services and serve you better.
              </p>
              <p style={{ margin: '0 0 4px', fontWeight: 600 }}>
                📝 Click the link below to share your feedback:
              </p>
              <p style={{ margin: '0 0 10px', wordBreak: 'break-all' }}>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: 'var(--primary)',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Click link to open public feedback form"
                >
                  <span>{publicUrl}</span>
                  <ExternalLink size={13} />
                </a>
              </p>
              <p style={{ margin: 0 }}>Thank you for your time and support! 🙏</p>
            </div>
            {copiedMessage && (
              <p style={{ color: '#10b981', fontSize: '0.84rem', margin: '2px 0 0', fontWeight: 600 }}>
                ✓ Invitation message copied to clipboard!
              </p>
            )}
          </div>

          {/* Public Feedback Form URL */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label
                style={{
                  fontSize: '0.86rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: 0,
                }}
              >
                <Globe size={15} color="var(--text-muted)" />
                <span>Public Feedback Form URL</span>
              </label>

              <button
                type="button"
                className="btn btn-link"
                onClick={() => setShowDomainSettings(!showDomainSettings)}
                style={{ padding: 0, fontSize: '0.78rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Configure custom domain or local network IP"
              >
                <Settings2 size={13} />
                <span>{showDomainSettings ? 'Hide Custom Domain' : 'Set Domain / IP'}</span>
              </button>
            </div>

            {/* Custom Domain/IP Config */}
            {showDomainSettings && (
              <div style={{ background: '#f1f5f9', padding: '10px 12px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Enter your production domain or local Wi-Fi IP so links are clickable on phones & WhatsApp:
                </span>
                <input
                  type="text"
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: '0.84rem' }}
                  placeholder="e.g. https://yourfeedbackhub.com or http://192.168.1.15:5173"
                  value={customDomain}
                  onChange={(e) => handleSaveDomain(e.target.value)}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                readOnly
                className="form-input"
                value={publicUrl}
                style={{
                  background: '#f8fafc',
                  fontSize: '0.9rem',
                  color: 'var(--text-main)',
                  fontWeight: 500,
                }}
                onClick={(e) => e.target.select()}
              />
              <button
                type="button"
                className={`btn ${copiedLink ? 'btn-success' : 'btn-primary'}`}
                onClick={handleCopyLink}
                style={{ whiteSpace: 'nowrap', gap: '6px', minWidth: '105px' }}
                title="Copy Public Form Link"
              >
                {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                title="Open public form in a new browser tab"
              >
                <ExternalLink size={15} />
                <span>Open</span>
              </a>
            </div>

            {/* Localhost Explanatory Hint */}
            {isLocalhost && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.78rem', color: '#64748b', background: '#f8fafc', padding: '8px 10px', borderRadius: '8px' }}>
                <Info size={14} color="#6366f1" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Tip for WhatsApp / Mobile:</strong> WhatsApp keeps <code>localhost</code> URLs as plain text for security because localhost only runs on this computer. When you deploy with a real domain (e.g. <code>https://yourdomain.com</code>) or enter your network IP above, WhatsApp automatically turns it into a clickable blue link.
                </span>
              </div>
            )}
          </div>

          {/* Quick Actions & QR Code Toggle */}
          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary share-channel-btn"
              style={{ flex: 1, textDecoration: 'none' }}
            >
              <ExternalLink size={15} color="var(--primary)" />
              <span>Preview Form</span>
            </a>

            <button
              type="button"
              className={`btn btn-secondary share-channel-btn ${showQr ? 'active' : ''}`}
              style={{ flex: 1 }}
              onClick={() => setShowQr(!showQr)}
            >
              <QrCode size={15} color="#8b5cf6" />
              <span>{showQr ? 'Hide QR' : 'QR Code'}</span>
            </button>
          </div>

          {/* QR Code Expansion */}
          {showQr && (
            <div
              style={{
                textAlign: 'center',
                padding: '18px',
                background: '#f8fafc',
                borderRadius: '14px',
                border: '1px solid var(--border-light)',
              }}
            >
              <h5 style={{ margin: '0 0 8px', fontSize: '0.92rem', color: 'var(--text-main)' }}>
                Scan to Open Feedback Form
              </h5>
              <img
                src={qrUrl}
                alt="Form QR Code"
                style={{
                  width: '180px',
                  height: '180px',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  background: '#ffffff',
                  padding: '8px',
                }}
              />
              <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Print or display this QR code at your checkout counter, tables, or product packaging.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Sparkles size={14} color="var(--primary)" />
            <span>Includes clickable link for emails & rich messaging</span>
          </div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
