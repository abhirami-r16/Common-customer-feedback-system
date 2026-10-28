const crypto = require('crypto');

/**
 * Generate a URL-friendly slug with random 6-character suffix
 * Example: 'Customer Feedback' -> 'customer-feedback-a8f3kd'
 */
function generateSlug(title) {
  const baseSlug = (title || 'form')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'form';

  const randomSuffix = crypto.randomBytes(3).toString('hex').toLowerCase();
  return `${baseSlug}-${randomSuffix}`;
}

module.exports = {
  generateSlug,
};
