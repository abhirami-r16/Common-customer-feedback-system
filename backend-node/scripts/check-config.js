/**
 * Safe Database Connection Configuration Diagnostic
 * Prints only host, port, database, username, and SSL/TLS status.
 * NEVER prints passwords, tokens, or sensitive secrets.
 */
const config = require('../src/config');

console.log('====================================================');
console.log('Database Connection Configuration (Safe Diagnostic)');
console.log('====================================================');
console.log(`Loaded Env File:   ${config.envPath || 'backend-node/.env'}`);
console.log(`Node Environment:  ${config.nodeEnv}`);
console.log(`Host:              ${config.db.host}`);
console.log(`Port:              ${config.db.port}`);
console.log(`Database:          ${config.db.database}`);
console.log(`Username:          ${config.db.user}`);
console.log(`Connection Limit:  ${config.db.connectionLimit}`);
console.log(`SSL Mode:          ${config.db.ssl ? 'ENABLED (Verified TLS)' : 'DISABLED'}`);
if (config.db.ssl) {
  console.log(`TLS Verification:  ${config.db.ssl.rejectUnauthorized ? 'Enabled (rejectUnauthorized: true)' : 'Disabled'}`);
  console.log(`CA Certificate:    ${config.db.ssl.ca ? 'Custom CA configured' : 'Using default trusted system CAs'}`);
}
console.log('====================================================');
console.log('Password & Secrets: [PROTECTED / NOT PRINTED]');
console.log('====================================================');
