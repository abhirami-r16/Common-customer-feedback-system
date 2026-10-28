/**
 * Sample / Demo Data Seeding Script (Local Development Only)
 * Separated from schema initialization to prevent sample data from ever being seeded in production.
 */
const mysql = require('mysql2/promise');
const config = require('../src/config');

async function seedSampleData() {
  if (config.nodeEnv === 'production' && !process.env.FORCE_SEED) {
    console.error('[Error] Seeding sample/demo data into a production environment is disabled.');
    console.error('If you strictly intended to do this, set FORCE_SEED=1.');
    process.exit(1);
  }

  console.log(`[Seed] Connecting to ${config.db.host}:${config.db.port}/${config.db.database}...`);

  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    ssl: config.db.ssl,
    timezone: config.db.timezone || 'Z',
    dateStrings: true,
  });

  try {
    const [userRows] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (userRows[0].count > 0) {
      console.log(`[Seed] Database already contains ${userRows[0].count} users. Seeding aborted to preserve existing records.`);
      return;
    }

    console.log('[Seed] Populating sample baseline records for development testing...');

    // 1. Users
    await connection.query(`
      INSERT INTO users (id, name, email, password, organization_name, role, created_at, updated_at) VALUES
      (2, 'Abhirami.R', 'abhiramiabhiivk@gmail.com', '$2y$12$QPZgl1BOvgAUtUoC.ydu8Ovpz28qRY0vTGo3MaehXB/Dwf0wj8nga', 'Abhi designs', 'business', '2026-10-21 07:13:21', '2026-10-21 10:27:52'),
      (3, 'System Administrator', 'admin@gmail.com', '$2y$12$OKqJiwQpLSPL2ba/eUCFLOR0DsSqCShEf4gqreXMyYEag3fOyQP5a', 'FeedbackHub Platform', 'admin', '2026-10-21 10:42:50', '2026-10-23 08:06:39'),
      (7, 'Akhila', 'akhila@gmail.com', '$2y$12$kpYSSAsrCVyPS/0SmcKrh.Ul8y35s01tvE2qRxoQXfmjxIw/GwCgy', 'Akx living', 'business', '2026-10-26 05:53:54', '2026-10-27 07:17:05')
    `);

    // 2. Forms
    await connection.query(`
      INSERT INTO feedback_forms (id, user_id, title, slug, status, created_at, updated_at) VALUES
      (12, 2, 'customer feedback', 'customer-feedback-qduper', 'published', '2026-10-21 08:37:27', '2026-10-21 08:37:27'),
      (13, 7, 'customer feedback', 'customer-feedback-aal4jp', 'draft', '2026-10-26 06:00:47', '2026-10-26 06:00:47')
    `);

    // 3. Sections
    await connection.query(`
      INSERT INTO form_sections (id, feedback_form_id, title, position, created_at, updated_at) VALUES
      (12, 12, 'General Feedback', 0, '2026-10-21 08:37:27', '2026-10-21 08:37:27'),
      (13, 13, 'General Feedback', 0, '2026-10-26 06:00:47', '2026-10-26 06:00:47')
    `);

    // 4. Questions
    await connection.query(`
      INSERT INTO form_questions (id, form_section_id, question_text, question_type, is_required, settings, position, created_at, updated_at) VALUES
      (30, 12, 'How satisfied are you with our overall service?', 'star_rating', 1, '{"max_rating":5}', 0, '2026-10-21 08:37:27', '2026-10-21 08:37:27'),
      (31, 12, 'Which aspect of our service did you use most?', 'multiple_choice', 0, '[]', 1, '2026-10-21 08:37:27', '2026-10-21 08:37:27'),
      (33, 13, 'how satisfied you are', 'multiple_choice', 0, '[]', 0, '2026-10-26 06:00:47', '2026-10-26 06:00:47')
    `);

    // 5. Question Options
    await connection.query(`
      INSERT INTO question_options (id, form_question_id, option_text, position, created_at, updated_at) VALUES
      (31, 31, 'Customer Support', 0, '2026-10-21 08:37:27', '2026-10-21 08:37:27'),
      (32, 31, 'Fast Delivery', 1, '2026-10-21 08:37:27', '2026-10-21 08:37:27'),
      (33, 31, 'Product Quality', 2, '2026-10-21 08:37:27', '2026-10-21 08:37:27'),
      (34, 33, 'customer feedback', 0, '2026-10-26 06:00:47', '2026-10-26 06:00:47'),
      (35, 33, 'quality', 1, '2026-10-26 06:00:47', '2026-10-26 06:00:47')
    `);

    // 6. Submissions
    await connection.query(`
      INSERT INTO feedback_submissions (id, feedback_form_id, customer_name, customer_email, rating, summary_preview, review_status, ip_address, client_token, created_at, updated_at) VALUES
      (8, 12, 'Abhirami.R', 'abhiramiabhiivk@gmail.com', 5, 'How satisfied are you with our overall service?: 5 | Which aspect of our service did you use most?: Customer Support | h: hhh', 'new', NULL, NULL, '2026-10-21 08:38:00', '2026-10-21 08:38:00'),
      (9, 13, 'abhirami', 'abhiramiabhiivk@gmail.com', 5, 'how satisfied you are: customer feedback', 'new', '127.0.0.1', 'usr_tey65a7mvg_mvm1tlev', '2026-10-26 06:01:00', '2026-10-26 06:01:00')
    `);

    console.log('[Seed] Sample data successfully seeded for local testing.');
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  seedSampleData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]:', err.message);
      process.exit(1);
    });
}

module.exports = seedSampleData;
