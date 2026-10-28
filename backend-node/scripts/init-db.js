/**
 * Safe, additive database setup script.
 * Never drops tables or deletes records.
 * Uses CREATE TABLE IF NOT EXISTS.
 */
const mysql = require('mysql2/promise');
const config = require('../src/config');

async function initDb() {
  console.log(`Connecting to MySQL host: ${config.db.host}:${config.db.port}...`);

  // Connect without database first to ensure database exists
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
  });

  try {
    const dbName = config.db.database;
    console.log(`Ensuring database \`${dbName}\` exists (non-destructive)...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${dbName}\``);

    console.log('Creating schema tables if they do not exist...');

    // 1. Users table
    await connection.query(`
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
    await connection.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        email VARCHAR(255) PRIMARY KEY,
        token VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Personal Access Tokens table (Laravel Sanctum compatible)
    await connection.query(`
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
    await connection.query(`
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
    await connection.query(`
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
    await connection.query(`
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
    await connection.query(`
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
    await connection.query(`
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

    console.log('[Schema] All 8 tables verified successfully.');

    // Check if users table is empty; if so, populate initial seed data
    const [userRows] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (userRows[0].count === 0) {
      console.log('[Seed] Users table is empty. Populating baseline data with preserved IDs...');

      // Insert baseline users
      await connection.query(`
        INSERT INTO users (id, name, email, password, organization_name, role, created_at, updated_at) VALUES
        (2, 'Abhirami.R', 'abhiramiabhiivk@gmail.com', '$2y$12$QPZgl1BOvgAUtUoC.ydu8Ovpz28qRY0vTGo3MaehXB/Dwf0wj8nga', 'Abhi designs', 'business', '2026-10-21 07:13:21', '2026-10-21 10:27:52'),
        (3, 'System Administrator', 'admin@gmail.com', '$2y$12$OKqJiwQpLSPL2ba/eUCFLOR0DsSqCShEf4gqreXMyYEag3fOyQP5a', 'FeedbackHub Platform', 'admin', '2026-10-21 10:42:50', '2026-10-23 08:06:39'),
        (7, 'Akhila', 'akhila@gmail.com', '$2y$12$kpYSSAsrCVyPS/0SmcKrh.Ul8y35s01tvE2qRxoQXfmjxIw/GwCgy', 'Akx living', 'business', '2026-10-26 05:53:54', '2026-10-27 07:17:05')
      `);

      // Insert baseline forms
      await connection.query(`
        INSERT INTO feedback_forms (id, user_id, title, slug, status, created_at, updated_at) VALUES
        (12, 2, 'customer feedback', 'customer-feedback-qduper', 'published', '2026-10-21 08:37:27', '2026-10-21 08:37:27'),
        (13, 7, 'customer feedback', 'customer-feedback-aal4jp', 'draft', '2026-10-26 06:00:47', '2026-10-26 06:00:47')
      `);

      // Insert baseline sections
      await connection.query(`
        INSERT INTO form_sections (id, feedback_form_id, title, position, created_at, updated_at) VALUES
        (12, 12, 'General Feedback', 0, '2026-10-21 08:37:27', '2026-10-21 08:37:27'),
        (13, 13, 'General Feedback', 0, '2026-10-26 06:00:47', '2026-10-26 06:00:47')
      `);

      // Insert baseline questions
      await connection.query(`
        INSERT INTO form_questions (id, form_section_id, question_text, question_type, is_required, settings, position, created_at, updated_at) VALUES
        (30, 12, 'How satisfied are you with our overall service?', 'star_rating', 1, '{"max_rating":5}', 0, '2026-10-21 08:37:27', '2026-10-21 08:37:27'),
        (31, 12, 'Which aspect of our service did you use most?', 'multiple_choice', 0, '[]', 1, '2026-10-21 08:37:27', '2026-10-21 08:37:27'),
        (33, 13, 'how satisfied you are', 'multiple_choice', 0, '[]', 0, '2026-10-26 06:00:47', '2026-10-26 06:00:47')
      `);

      // Insert baseline question options
      await connection.query(`
        INSERT INTO question_options (id, form_question_id, option_text, position, created_at, updated_at) VALUES
        (31, 31, 'Customer Support', 0, '2026-10-21 08:37:27', '2026-10-21 08:37:27'),
        (32, 31, 'Fast Delivery', 1, '2026-10-21 08:37:27', '2026-10-21 08:37:27'),
        (33, 31, 'Product Quality', 2, '2026-10-21 08:37:27', '2026-10-21 08:37:27'),
        (34, 33, 'customer feedback', 0, '2026-10-26 06:00:47', '2026-10-26 06:00:47'),
        (35, 33, 'quality', 1, '2026-10-26 06:00:47', '2026-10-26 06:00:47')
      `);

      // Insert baseline submissions
      await connection.query(`
        INSERT INTO feedback_submissions (id, feedback_form_id, customer_name, customer_email, rating, summary_preview, review_status, ip_address, client_token, created_at, updated_at) VALUES
        (8, 12, 'Abhirami.R', 'abhiramiabhiivk@gmail.com', 5, 'How satisfied are you with our overall service?: 5 | Which aspect of our service did you use most?: Customer Support | h: hhh', 'new', NULL, NULL, '2026-10-21 08:38:00', '2026-10-21 08:38:00'),
        (9, 13, 'abhirami', 'abhiramiabhiivk@gmail.com', 5, 'how satisfied you are: customer feedback', 'new', '127.0.0.1', 'usr_tey65a7mvg_mvm1tlev', '2026-10-26 06:01:00', '2026-10-26 06:01:00')
      `);

      console.log('[Seed] Baseline records seeded successfully.');
    } else {
      console.log(`[Seed] Database already contains ${userRows[0].count} users. Preserving all existing records.`);
    }

    console.log('[Init] Database initialization complete.');
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  initDb()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Init Error]:', err);
      process.exit(1);
    });
}

module.exports = initDb;
