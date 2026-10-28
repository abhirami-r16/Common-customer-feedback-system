const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../config/database');
const { enhanceUser } = require('../middleware/auth');

/**
 * Generates an API token for a user
 */
async function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '30d' });

  // Also record in personal_access_tokens for compatibility and audit
  try {
    const plainSecret = crypto.randomBytes(20).toString('hex');
    const hashed = crypto.createHash('sha256').update(plainSecret).digest('hex');
    await db.execute(
      `INSERT INTO personal_access_tokens 
       (tokenable_type, tokenable_id, name, token, abilities, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      ['App\\Models\\User', user.id, 'auth_token', hashed, '["*"]']
    );
  } catch (patErr) {
    // If table doesn't exist yet during initial setup, token still works via JWT
  }

  return token;
}

/**
 * Register a new business customer account
 */
async function register(req, res, next) {
  try {
    const { name, email, password, organization_name } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    // Check unique email
    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(422).json({
        message: 'The email has already been taken.',
        errors: { email: ['The email has already been taken.'] },
      });
    }

    const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);

    const result = await db.execute(
      `INSERT INTO users (name, email, password, organization_name, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [name.trim(), cleanEmail, hashedPassword, organization_name.trim(), 'business']
    );

    const userId = result.insertId;
    const users = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = enhanceUser(users[0]);
    const token = await generateToken(user);

    res.status(201).json({
      message: 'Registration successful.',
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Authenticate user credentials and return API token
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    const users = await db.query('SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1', [cleanEmail]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const rawUser = users[0];
    const passwordMatch = await bcrypt.compare(password, rawUser.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Securely synchronize backend admin role if email matches ADMIN_EMAIL
    if (config.adminEmail && cleanEmail === config.adminEmail && rawUser.role !== 'admin') {
      await db.execute('UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?', ['admin', rawUser.id]);
      rawUser.role = 'admin';
    }

    const user = enhanceUser(rawUser);
    const token = await generateToken(user);

    res.status(200).json({
      message: 'Login successful.',
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Log out user by revoking token
 */
async function logout(req, res, next) {
  try {
    if (req.user && req.token && req.token.includes('|')) {
      const [tokenId] = req.token.split('|');
      await db.execute('DELETE FROM personal_access_tokens WHERE id = ?', [tokenId]);
    }

    res.status(200).json({
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get authenticated user profile
 */
async function user(req, res) {
  res.status(200).json(req.user);
}

/**
 * Send password reset instructions
 */
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    const users = await db.query('SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1', [cleanEmail]);
    if (users.length === 0) {
      return res.status(422).json({
        message: 'We could not find an account with that email address.',
        errors: {
          email: ['No registered account matches this email address.'],
        },
      });
    }

    const user = users[0];
    const token = crypto.randomBytes(32).toString('hex');

    // Update or insert into password_reset_tokens
    await db.execute(
      `INSERT INTO password_reset_tokens (email, token, created_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE token = VALUES(token), created_at = NOW()`,
      [user.email, token]
    );

    const frontendBase = config.frontendUrl || 'http://localhost:5173';
    const resetUrl = `${frontendBase.replace(/\/+$/, '')}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    res.status(200).json({
      message: 'Password reset instructions have been generated.',
      email: user.email,
      token,
      reset_url: resetUrl,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reset password using token
 */
async function resetPassword(req, res, next) {
  try {
    const { email, token, password } = req.body;
    const cleanEmail = email.trim().toLowerCase();

    const users = await db.query('SELECT * FROM users WHERE LOWER(email) = ? LIMIT 1', [cleanEmail]);
    if (users.length === 0) {
      return res.status(422).json({
        message: 'We could not find an account with that email address.',
        errors: {
          email: ['No registered account matches this email address.'],
        },
      });
    }

    const user = users[0];

    // If token is provided, validate it
    if (token) {
      const records = await db.query(
        'SELECT * FROM password_reset_tokens WHERE email = ? LIMIT 1',
        [user.email]
      );

      if (records.length === 0 || records[0].token !== token) {
        return res.status(422).json({
          message: 'The password reset token is invalid or has already been used.',
          errors: {
            token: ['Invalid or expired reset token.'],
          },
        });
      }

      // Check token expiration (60 minutes limit matching Laravel auth defaults)
      if (records[0].created_at) {
        const tokenAgeMs = Date.now() - new Date(records[0].created_at).getTime();
        const sixtyMinutesMs = 60 * 60 * 1000;
        if (tokenAgeMs > sixtyMinutesMs) {
          return res.status(422).json({
            message: 'The password reset token is invalid or has already been used.',
            errors: {
              token: ['Invalid or expired reset token.'],
            },
          });
        }
      }
    }

    // Update password
    const hashedPassword = await bcrypt.hash(password, config.bcryptRounds);
    await db.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, user.id]
    );

    // Clean up reset token
    await db.execute('DELETE FROM password_reset_tokens WHERE email = ?', [user.email]);

    res.status(200).json({
      message: 'Password has been changed successfully. You can now sign in with your new password.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  logout,
  user,
  forgotPassword,
  resetPassword,
};
