const mysql = require('mysql2/promise');
const config = require('./index');

let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(config.db);
  }
  return pool;
}

/**
 * Execute a query with parameters
 */
async function query(sql, params = []) {
  const p = getPool();
  const [rows] = await p.execute(sql, params);
  return rows;
}

/**
 * Execute a query returning full result (including insertId, affectedRows)
 */
async function execute(sql, params = []) {
  const p = getPool();
  const [result] = await p.execute(sql, params);
  return result;
}

/**
 * Run a transaction
 */
async function transaction(callback) {
  const p = getPool();
  const connection = await p.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Test connectivity
 */
async function testConnection() {
  const p = getPool();
  const connection = await p.getConnection();
  connection.release();
  return true;
}

module.exports = {
  getPool,
  query,
  execute,
  transaction,
  testConnection,
};
