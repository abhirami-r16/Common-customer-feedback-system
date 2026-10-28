const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../config/database');

/**
 * Creates user object with helper methods
 */
function enhanceUser(row) {
  if (!row) return null;
  const user = { ...row };
  delete user.password;
  delete user.remember_token;

  user.isAdmin = () => user.role === 'admin';
  user.isBusiness = () => user.role === 'business' || user.role === 'user';
  return user;
}

/**
 * Verifies authentication token (Supports both JWT and Laravel Sanctum tokens)
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthenticated.' });
  }

  const rawToken = authHeader.substring(7).trim();
  if (!rawToken) {
    return res.status(401).json({ message: 'Unauthenticated.' });
  }

  try {
    let user = null;

    // 1. Check if token is in Sanctum format (e.g. "1|abc123xyz...")
    if (rawToken.includes('|')) {
      const [tokenId, plainToken] = rawToken.split('|');
      const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');

      const tokens = await db.query(
        'SELECT * FROM personal_access_tokens WHERE id = ? AND token = ? LIMIT 1',
        [tokenId, hashedToken]
      );

      if (tokens.length > 0) {
        const pat = tokens[0];
        // Check expiration if set
        if (!pat.expires_at || new Date(pat.expires_at) > new Date()) {
          const users = await db.query(
            'SELECT * FROM users WHERE id = ? LIMIT 1',
            [pat.tokenable_id]
          );
          if (users.length > 0) {
            user = enhanceUser(users[0]);
            // Update last_used_at in background
            db.execute(
              'UPDATE personal_access_tokens SET last_used_at = NOW() WHERE id = ?',
              [pat.id]
            ).catch(() => {});
          }
        }
      }
    }

    // 2. If not found via Sanctum, check as JWT
    if (!user) {
      try {
        const decoded = jwt.verify(rawToken, config.jwtSecret);
        const users = await db.query(
          'SELECT * FROM users WHERE id = ? LIMIT 1',
          [decoded.id]
        );
        if (users.length > 0) {
          user = enhanceUser(users[0]);
        }
      } catch (jwtErr) {
        // JWT verification failed
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Unauthenticated.' });
    }

    req.user = user;
    req.token = rawToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Unauthenticated.' });
  }
}

/**
 * Role authorization middleware
 */
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthenticated.' });
    }

    if (role === 'admin' && !req.user.isAdmin()) {
      return res.status(403).json({
        message: 'Unauthorized: Platform Administrator privileges required.',
      });
    }

    if (role === 'business' && !req.user.isBusiness()) {
      return res.status(403).json({
        message: 'Unauthorized: Business customer account required. Administrator accounts must use the Admin Portal.',
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  requireRole,
  enhanceUser,
};
