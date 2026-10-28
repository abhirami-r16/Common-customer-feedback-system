const app = require('./app');
const config = require('./config');
const db = require('./config/database');

const server = app.listen(config.port, async () => {
  console.log(`====================================================`);
  console.log(`Common Customer Feedback System API (Node.js)`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Server listening on port: ${config.port}`);
  console.log(`API Base URL: http://localhost:${config.port}/api`);
  console.log(`Health Check: http://localhost:${config.port}/api/health`);
  console.log(`====================================================`);

  try {
    await db.testConnection();
    console.log(`[Database] Successfully connected to MySQL at ${config.db.host}:${config.db.port}/${config.db.database}`);
  } catch (err) {
    console.error(`[Database] Warning: Could not establish immediate MySQL connection: ${err.message}`);
    console.error(`[Database] Verify that MySQL service is running and credentials in .env are valid.`);
  }
});

function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    try {
      const pool = db.getPool();
      await pool.end();
      console.log('[Database] Connection pool closed.');
    } catch (e) {
      // Ignore
    }
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
