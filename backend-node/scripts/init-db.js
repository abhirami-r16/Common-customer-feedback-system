/**
 * Safe, additive database schema initialization script.
 * Supports Aiven MySQL and cloud managed instances with SSL/TLS certificate verification.
 *
 * Strict safety rules:
 * - Never drops or truncates tables.
 * - Uses CREATE TABLE IF NOT EXISTS exclusively.
 * - Connects directly to the existing database (defaultdb) without attempting CREATE DATABASE.
 * - NEVER automatically seeds sample users, forms, or submissions into production.
 * - Uses the shared MySQL pool with verified TLS.
 * - Performs post-creation table verification to guarantee all 8 tables exist.
 * - Exits with a non-zero code on any failure.
 */
const config = require('../src/config');
const db = require('../src/config/database');

async function initDb() {
  const isSsl = Boolean(config.db.ssl);
  console.log(`====================================================`);
  console.log(`Database Schema Initialization`);
  console.log(`Loaded Env: ${config.envPath || 'backend-node/.env'}`);
  console.log(`Host: ${config.db.host}:${config.db.port}`);
  console.log(`Database: ${config.db.database}`);
  console.log(`User: ${config.db.user}`);
  console.log(`SSL/TLS: ${isSsl ? `Enabled (rejectUnauthorized: ${config.db.ssl.rejectUnauthorized})` : 'Disabled'}`);
  console.log(`====================================================`);

  const pool = db.getPool();

  try {
    console.log(`Acquiring connection from shared MySQL pool for \`${config.db.database}\`...`);
    const testConn = await pool.getConnection();
    testConn.release();
    console.log(`[Success] Connected to database \`${config.db.database}\` via shared pool.`);
  } catch (err) {
    console.error('\n[Database Connection Error]:');
    if (err.code === 'ECONNREFUSED') {
      console.error(`- Connection refused to ${config.db.host}:${config.db.port}. Please verify the host and port.`);
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error(`- Access denied for user '${config.db.user}'. Please check username and password.`);
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error(`- Database '${config.db.database}' does not exist on the server. For Aiven MySQL, ensure DB_DATABASE=defaultdb.`);
    } else if (err.message && (err.message.includes('SSL') || err.message.includes('certificate') || err.code === 'HANDSHAKE_SSL_ERROR')) {
      console.error(`- SSL Handshake / Certificate Verification Error: ${err.message}`);
      console.error('  If using Aiven, ensure the Aiven CA certificate (ca.pem) is downloaded and configured via DB_SSL_CA_PATH or placed in backend-node/.');
    } else {
      console.error(`- ${err.message} (${err.code || 'UNKNOWN_CODE'})`);
    }
    throw err;
  }

  try {
    console.log('\nCreating schema tables if they do not exist (non-destructive)...');

    // 1. Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        organization_name VARCHAR(255) NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        role VARCHAR(255) NOT NULL DEFAULT 'business',
        email_verified_at TIMESTAMP NULL,
        password VARCHAR(255) NOT NULL,
        remember_token VARCHAR(100) NULL,
        created_at TIMESTAMP NULL,
        updated_at TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Password Reset Tokens table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        email VARCHAR(255) PRIMARY KEY,
        token VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Personal Access Tokens table (Laravel Sanctum compatible)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS personal_access_tokens (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        tokenable_type VARCHAR(255) NOT NULL,
        tokenable_id BIGINT UNSIGNED NOT NULL,
        name TEXT NOT NULL,
        token VARCHAR(64) NOT NULL UNIQUE,
        abilities TEXT NULL,
        last_used_at TIMESTAMP NULL,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP NULL,
        updated_at TIMESTAMP NULL,
        KEY personal_access_tokens_tokenable_type_tokenable_id_index (tokenable_type, tokenable_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Feedback Forms table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedback_forms (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT UNSIGNED NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        status ENUM('draft', 'published', 'unpublished') NOT NULL DEFAULT 'draft',
        created_at TIMESTAMP NULL,
        updated_at TIMESTAMP NULL,
        CONSTRAINT fk_feedback_forms_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Form Sections table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS form_sections (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        feedback_form_id BIGINT UNSIGNED NOT NULL,
        title VARCHAR(255) NOT NULL DEFAULT 'General Questions',
        description TEXT NULL,
        position INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NULL,
        updated_at TIMESTAMP NULL,
        CONSTRAINT fk_form_sections_form_id FOREIGN KEY (feedback_form_id) REFERENCES feedback_forms (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Form Questions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS form_questions (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        form_section_id BIGINT UNSIGNED NOT NULL,
        question_text TEXT NOT NULL,
        question_type VARCHAR(255) NOT NULL,
        is_required TINYINT(1) NOT NULL DEFAULT 0,
        settings JSON NULL,
        position INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NULL,
        updated_at TIMESTAMP NULL,
        CONSTRAINT fk_form_questions_section_id FOREIGN KEY (form_section_id) REFERENCES form_sections (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. Question Options table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS question_options (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        form_question_id BIGINT UNSIGNED NOT NULL,
        option_text VARCHAR(255) NOT NULL,
        position INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NULL,
        updated_at TIMESTAMP NULL,
        CONSTRAINT fk_question_options_question_id FOREIGN KEY (form_question_id) REFERENCES form_questions (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. Feedback Submissions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedback_submissions (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        feedback_form_id BIGINT UNSIGNED NOT NULL,
        customer_name VARCHAR(255) NULL,
        customer_email VARCHAR(255) NULL,
        ip_address VARCHAR(45) NULL,
        client_token VARCHAR(64) NULL,
        rating TINYINT UNSIGNED NULL,
        summary_preview TEXT NULL,
        review_status ENUM('new', 'reviewed', 'flagged') NOT NULL DEFAULT 'new',
        internal_notes LONGTEXT NULL,
        created_at TIMESTAMP NULL,
        updated_at TIMESTAMP NULL,
        CONSTRAINT fk_feedback_submissions_form_id FOREIGN KEY (feedback_form_id) REFERENCES feedback_forms (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('\nVerifying created schema tables in database...');
    const expectedTables = [
      'users',
      'password_reset_tokens',
      'personal_access_tokens',
      'feedback_forms',
      'form_sections',
      'form_questions',
      'question_options',
      'feedback_submissions',
    ];

    const [tableRows] = await pool.query('SHOW TABLES');
    const existingTables = tableRows.map((r) => Object.values(r)[0]);

    const missingTables = expectedTables.filter((t) => !existingTables.includes(t));
    if (missingTables.length > 0) {
      throw new Error(`Schema verification failed. Missing tables: ${missingTables.join(', ')}`);
    }

    console.log('[Schema] All 8 schema tables verified / initialized successfully:');
    for (const t of expectedTables) {
      console.log(` - ${t} [VERIFIED]`);
    }

    console.log('\n[Production Safety] Verified: No sample users or demo submissions were seeded.');
    console.log('[Init] Database schema initialization complete.');
  } catch (err) {
    console.error('\n[Schema Initialization Error]:', err.message || err);
    throw err;
  } finally {
    try {
      await pool.end();
    } catch (e) {
      // Ignore pool close error
    }
  }
}

if (require.main === module) {
  initDb()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('\n[Fatal Error]: Database initialization failed.', err.message || err);
      process.exit(1);
    });
}

module.exports = initDb;
