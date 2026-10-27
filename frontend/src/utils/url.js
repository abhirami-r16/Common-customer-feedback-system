/**
 * Generates the full public customer feedback URL for a given form slug.
 * Prioritizes the production environment configuration (VITE_PUBLIC_URL or VITE_APP_URL)
 * and falls back to window.location.origin dynamically so it never hardcodes localhost.
 */
export function getPublicFormUrl(slug) {
  if (!slug) return '';
  
  const envBaseUrl = import.meta.env.VITE_PUBLIC_URL || import.meta.env.VITE_APP_URL;
  if (envBaseUrl && typeof envBaseUrl === 'string' && envBaseUrl.trim() !== '') {
    const trimmed = envBaseUrl.trim().replace(/\/+$/, '');
    return `${trimmed}/f/${slug}`;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/f/${slug}`;
  }

  return `/f/${slug}`;
}

/**
 * Generates the standardized professional customer feedback invitation message (Plain Text).
 * Formatted with complete public URL for WhatsApp, SMS, and plain-text messengers.
 */
export function generateFeedbackInvitationMessage(formTitle, publicFormUrl) {
  const title = formTitle || 'our services';
  return `Hello! 👋\n\nWe’d love to hear your feedback on ${title}!\n\nPlease take a moment to complete our feedback form and share your valuable thoughts. Your feedback will help us improve our services and serve you better.\n\n📝 Click the link below to share your feedback:\n${publicFormUrl}\n\nThank you for your time and support! 🙏`;
}

/**
 * Generates rich HTML version of the invitation message with active clickable hyperlink.
 * Used for clipboard rich-text pasting into email clients (Gmail, Outlook) and rich text editors.
 */
export function generateFeedbackInvitationHtml(formTitle, publicFormUrl) {
  const title = formTitle || 'our services';
  return `<p>Hello! 👋</p><p>We’d love to hear your feedback on <strong>${title}</strong>!</p><p>Please take a moment to complete our feedback form and share your valuable thoughts. Your feedback will help us improve our services and serve you better.</p><p>📝 Click the link below to share your feedback:<br/><a href="${publicFormUrl}" target="_blank" rel="noopener noreferrer">${publicFormUrl}</a></p><p>Thank you for your time and support! 🙏</p>`;
}
