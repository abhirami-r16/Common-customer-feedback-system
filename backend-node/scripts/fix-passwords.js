const mysql = require('mysql2/promise');
const config = require('../src/config');

async function fixPasswords() {
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
  });

  try {
    const adminHash = '$2y$12$OKqJiwQpLSPL2ba/eUCFLOR0DsSqCShEf4gqreXMyYEag3fOyQP5a';
    const abhiHash = '$2y$12$QPZgl1BOvgAUtUoC.ydu8Ovpz28qRY0vTGo3MaehXB/Dwf0wj8nga';
    const akhilaHash = '$2y$12$kpYSSAsrCVyPS/0SmcKrh.Ul8y35s01tvE2qRxoQXfmjxIw/GwCgy';

    await connection.execute('UPDATE users SET password = ? WHERE id = 3', [adminHash]);
    await connection.execute('UPDATE users SET password = ? WHERE id = 2', [abhiHash]);
    await connection.execute('UPDATE users SET password = ? WHERE id = 7', [akhilaHash]);

    const [rows] = await connection.execute('SELECT id, email, password FROM users');
    console.log('[Fix] Verified user passwords:');
    rows.forEach(r => console.log(`  - User ${r.id} (${r.email}): ${r.password.substring(0, 10)}...`));
  } finally {
    await connection.end();
  }
}

fixPasswords()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
