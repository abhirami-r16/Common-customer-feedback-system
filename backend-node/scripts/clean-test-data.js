const mysql = require('mysql2/promise');
const config = require('../src/config');

async function cleanLeftovers() {
  const c = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
  });

  try {
    // 1. Delete test forms and their cascaded submissions
    await c.execute("DELETE FROM feedback_forms WHERE title = 'Temp Form For Deletion' OR slug LIKE 'temp-del-slug-%'");
    
    // 2. Delete test submissions
    await c.execute("DELETE FROM feedback_submissions WHERE customer_name = 'Admin Deletion Test'");

    // 3. Delete test users (which cascades forms and submissions)
    await c.execute("DELETE FROM users WHERE email LIKE 'test_biz_%'");

    // 4. Delete test tokens
    await c.execute("DELETE FROM personal_access_tokens WHERE name = 'sanctum_test'");

    console.log('[Cleanup] Cleaned up all leftover test records.');

    // Verify baseline records
    const [users] = await c.query('SELECT id, name, email, role FROM users ORDER BY id ASC');
    console.log(`[Baseline Users] Count: ${users.length}`);
    users.forEach(u => console.log(`  - User ${u.id}: ${u.email} (${u.role})`));

    const [forms] = await c.query('SELECT id, user_id, title, slug, status FROM feedback_forms ORDER BY id ASC');
    console.log(`[Baseline Forms] Count: ${forms.length}`);
    forms.forEach(f => console.log(`  - Form ${f.id} (owner: ${f.user_id}): "${f.title}" [${f.status}]`));

    const [subs] = await c.query('SELECT id, feedback_form_id, customer_name, rating FROM feedback_submissions ORDER BY id ASC');
    console.log(`[Baseline Submissions] Count: ${subs.length}`);
    subs.forEach(s => console.log(`  - Submission ${s.id} (form: ${s.feedback_form_id}): ${s.customer_name} (rating: ${s.rating})`));
  } finally {
    await c.end();
  }
}

cleanLeftovers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
