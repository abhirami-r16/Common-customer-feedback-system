const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Trust reverse proxy (needed for req.ip behind Vercel / Nginx / Cloudflare)
app.set('trust proxy', 1);

// Configure CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const isAllowed = config.allowedOrigins.some((allowed) => {
      if (allowed === '*') return true;
      return allowed.toLowerCase() === origin.toLowerCase();
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      // In production log warning, but don't crash
      callback(null, true); // Permissive fallback to match Laravel's open CORS
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount all API routes under /api
app.use('/api', routes);

// Root fallback / ping
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Common Customer Feedback System API (Node.js)',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// 404 Not Found Handler for unknown routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
