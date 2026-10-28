const fs = require('fs');
const path = require('path');

// Explicitly load .env from backend-node directory so it works from any cwd
const backendEnvPath = path.resolve(__dirname, '../../.env');
const rootEnvPath = path.resolve(process.cwd(), '.env');

let loadedEnvPath = null;
if (fs.existsSync(backendEnvPath)) {
  require('dotenv').config({ path: backendEnvPath });
  loadedEnvPath = backendEnvPath;
}
if (fs.existsSync(rootEnvPath) && rootEnvPath !== backendEnvPath) {
  require('dotenv').config({ path: rootEnvPath });
  if (!loadedEnvPath) loadedEnvPath = rootEnvPath;
}
if (!loadedEnvPath) {
  require('dotenv').config();
  loadedEnvPath = 'process.env';
}

/**
 * Builds the SSL/TLS configuration for MySQL connections.
 * Supports Aiven and managed cloud MySQL providers with certificate verification enabled.
 */
function buildSslConfig() {
  const sslMode = (process.env.DB_SSL_MODE || '').toUpperCase();
  const isSslEnabled =
    process.env.DB_SSL === 'true' ||
    process.env.DB_SSL === '1' ||
    sslMode === 'REQUIRED' ||
    sslMode === 'VERIFY_CA' ||
    sslMode === 'VERIFY_IDENTITY';

  if (!isSslEnabled) {
    return undefined;
  }

  // Certificate verification strictly enabled by default
  const ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };

  // 1. Direct CA certificate content provided in environment variable
  if (process.env.DB_SSL_CA && process.env.DB_SSL_CA.trim()) {
    ssl.ca = process.env.DB_SSL_CA.trim();
  }
  // 2. CA certificate file path provided in environment variable
  else if (process.env.DB_SSL_CA_PATH) {
    const resolvedPath = path.isAbsolute(process.env.DB_SSL_CA_PATH)
      ? process.env.DB_SSL_CA_PATH
      : path.resolve(__dirname, '../../', process.env.DB_SSL_CA_PATH);
    if (fs.existsSync(resolvedPath)) {
      ssl.ca = fs.readFileSync(resolvedPath, 'utf8');
    } else {
      console.warn(`[DB SSL Warning] Specified CA file not found at: ${resolvedPath}`);
    }
  }
  // 3. Auto-detect ca.pem in backend-node root or current working directory
  else {
    const candidatePaths = [
      path.resolve(__dirname, '../../ca.pem'),
      path.resolve(process.cwd(), 'ca.pem'),
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        ssl.ca = fs.readFileSync(p, 'utf8');
        break;
      }
    }
  }

  return ssl;
}

// Build list of allowed origins (production frontend + localhost development origins only)
const defaultAllowedOrigins = [
  'https://common-customer-feedback-system.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const envAllowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
  : [];

const originsList = [...defaultAllowedOrigins, ...envAllowedOrigins];
if (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim()) {
  originsList.push(process.env.FRONTEND_URL.trim());
}

// Normalize by removing trailing slashes and deduplicating
const allowedOrigins = Array.from(
  new Set(originsList.map((o) => o.replace(/\/$/, '').toLowerCase()))
);

const config = {
  envPath: loadedEnvPath,
  port: parseInt(process.env.PORT || '8000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    database: process.env.DB_DATABASE || 'defaultdb',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: process.env.DB_CONNECTION_LIMIT
      ? parseInt(process.env.DB_CONNECTION_LIMIT, 10)
      : (process.env.NODE_ENV === 'production' ? 3 : 10),
    queueLimit: 0,
    timezone: 'Z',
    dateStrings: true,
    ssl: buildSslConfig(),
  },
  jwtSecret: process.env.JWT_SECRET || 'super_secret_feedbackhub_jwt_key_2026_production_ready',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  adminEmail: (process.env.ADMIN_EMAIL || 'admin@gmail.com').toLowerCase(),
  frontendUrl: process.env.FRONTEND_URL || 'https://common-customer-feedback-system.vercel.app',
  allowedOrigins,
};

module.exports = config;
