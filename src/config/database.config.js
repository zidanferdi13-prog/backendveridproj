/**
 * Database Configuration
 * MySQL/MariaDB connection setup using mysql2
 */

const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

let pool = null;

/**
 * Database connection pool configuration
 */
const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'veridface',
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
 * @returns {Promise<void>}
 */
async function connectDatabase() {
  try {
    // Create connection pool
    pool = mysql.createPool(poolConfig);

    // Test connection
    const connection = await pool.getConnection();
    logger.info('✓ MySQL/MariaDB connected successfully', {
      host: poolConfig.host,
      port: poolConfig.port,
      database: poolConfig.database,
    });
    connection.release();

    // Add error handler for pool
    pool.on('error', (err) => {
      logger.error('MySQL pool error', { error: err.message });
    });

  } catch (error) {
    logger.error('Failed to connect to MySQL/MariaDB', { 
      error: error.message,
      host: poolConfig.host,
      database: poolConfig.database
    });
    throw error;
  }
}

/**
 * Disconnect from MySQL/MariaDB
 * @returns {Promise<void>}
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
    throw error;
  }
}

/**
 * Get connection status
 * @returns {boolean}
 */
function isConnected() {
  return pool !== null;
}

/**
 * Get database pool instance
 * @returns {mysql.Pool}
 */
function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectDatabase() first.');
  }
  return pool;
}

/**
 * Execute a query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>}
 */
async function query(sql, params = []) {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    logger.error('Database query error', { error: error.message, sql });
    throw error;
  }
}

/**
 * Get a connection from the pool
 * @returns {Promise<mysql.PoolConnection>}
 */
async function getConnection() {
  return await pool.getConnection();
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
  isConnected,
  getPool,
  query,
  getConnection,
};
