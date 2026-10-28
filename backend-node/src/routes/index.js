const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authRoutes = require('./authRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const formBuilderRoutes = require('./formBuilderRoutes');
const adminRoutes = require('./adminRoutes');

// Health Check Endpoint
router.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await db.query('SELECT 1');
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    uptime_seconds: Math.floor(process.uptime()),
  });
});

// Mount modular sub-routers
router.use('/admin', adminRoutes);
router.use('/', authRoutes);
router.use('/', formBuilderRoutes);
router.use('/', dashboardRoutes);

module.exports = router;
