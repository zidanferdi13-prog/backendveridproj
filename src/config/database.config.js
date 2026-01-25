/**
 * Database Configuration
 * MySQL/MariaDB connection setup using mysql2
 */

const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

let pool = null;

/**
 * Database connection pool configuration
 * (SETTING TIDAK DIUBAH)
 */
const poolConfig = {
  host: process.env.DB_HOST || process.env.MYSQLHOST,
  port: process.env.DB_PORT || process.env.MYSQLPORT,
  user: process.env.DB_USER || process.env.MYSQLUSER,
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

/**
 * Connect to MySQL/MariaDB
 */
async function connectDatabase() {
  try {
    pool = mysql.createPool(poolConfig);

    const connection = await pool.getConnection();
    logger.info('✓ MySQL/MariaDB connected successfully', {
      host: poolConfig.host,
      port: poolConfig.port,
      database: poolConfig.database,
    });
    connection.release();

    pool.on('error', (err) => {
      logger.error('MySQL pool error', { error: err.message });
    });

  } catch (error) {
    // ⛔ JANGAN MATIKAN APP DI RAILWAY
    logger.error('Failed to connect to MySQL/MariaDB', { 
      error: error.message,
      host: poolConfig.host,
      database: poolConfig.database
    });

    // BIARKAN SERVER TETAP JALAN
    pool = null;
  }
}

/**
 * Disconnect from MySQL/MariaDB
 */
async function disconnectDatabase() {
  try {
    if (pool) {
      await pool.end();
      pool = null;
      logger.info('MySQL/MariaDB disconnected');
    }
  } catch (error) {
    logger.error('Error disconnecting from MySQL/MariaDB', { error: error.message });
  }
}

/**
 * Get connection status
 */
function isConnected() {
  return pool !== null;
}

/**
 * Get database pool instance
 */
function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized.');
  }
  return pool;
}

/**
 * Execute a query
 */
async function query(sql, params = []) {
  if (!pool) {
    throw new Error('Database not connected');
  }

  let connection = null;
  try {
    connection = await pool.getConnection();
    await connection.query('SET AUTOCOMMIT=1');
    const [rows] = await connection.execute(sql, params);
    return rows;
  } catch (error) {
    logger.error('Database query error', { error: error.message, sql });
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Get a connection from the pool
 */
async function getConnection() {
  if (!pool) {
    throw new Error('Database not connected');
  }
  return pool.getConnection();
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
  isConnected,
  getPool,
  query,
  getConnection,
};
