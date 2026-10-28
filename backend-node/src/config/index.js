require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT || '8000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    database: process.env.DB_DATABASE || 'common_feedback_system',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: 'Z',
    dateStrings: true,
  },
  jwtSecret: process.env.JWT_SECRET || 'super_secret_feedbackhub_jwt_key_2026_production_ready',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  adminEmail: (process.env.ADMIN_EMAIL || 'admin@gmail.com').toLowerCase(),
  frontendUrl: process.env.FRONTEND_URL || 'https://common-customer-feedback-system.vercel.app',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'https://common-customer-feedback-system.vercel.app,http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map(o => o.trim()),
};

module.exports = config;
