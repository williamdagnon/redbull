import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306'),
  user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'apuic_capital',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z',
};

export const pool = mysql.createPool(dbConfig);

export const testConnection = async (): Promise<boolean> => {
  try {
    const conn = await pool.getConnection();
    await conn.query('SELECT NOW()');
    conn.release();
    console.log('✅ MySQL connection established');
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error);
    return false;
  }
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Try to establish a DB connection with retries and exponential backoff.
 * Returns true if a connection was established, false otherwise.
 */
export const ensureConnection = async (maxAttempts = 5, initialDelayMs = 1000): Promise<boolean> => {
  let attempt = 0;
  let delay = initialDelayMs;
  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      const conn = await pool.getConnection();
      await conn.query('SELECT 1');
      conn.release();
      console.log(`✅ MySQL connection established (attempt ${attempt})`);
      return true;
    } catch (err: any) {
      console.warn(`⚠️ MySQL connection attempt ${attempt} failed: ${err?.code || err?.message || err}`);
      if (attempt >= maxAttempts) break;
      console.log(`⏳ Waiting ${delay}ms before retrying...`);
      // exponential backoff
      await sleep(delay);
      delay *= 2;
    }
  }
  console.error(`❌ MySQL connection failed after ${maxAttempts} attempts`);
  return false;
};

export const query = async <T = any>(sql: string, params?: any[]): Promise<T[]> => {
  let normalizedSql = sql;
  try {
    // Normalize Postgres-style placeholders ($1, $2, ...) to MySQL `?`
    normalizedSql = sql.replace(/\$[0-9]+/g, '?');
    const [rows] = await pool.query(normalizedSql, params || []);
    return rows as T[];
  } catch (error) {
    console.error('Query error:', error);
    console.error('Query SQL:', normalizedSql);
    if (params && params.length) console.error('Query params:', params);
    throw error;
  }
};

export const queryOne = async <T = any>(sql: string, params?: any[]): Promise<T | null> => {
  try {
    const rows = await query<T>(sql, params || []);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('QueryOne error:', error);
    throw error;
  }
};

export const execute = async (sql: string, params?: any[]): Promise<{ affectedRows: number; insertId?: string | number }> => {
  let normalizedSql = sql;
  try {
    // Normalize Postgres-style placeholders ($1, $2, ...) to MySQL `?`
    normalizedSql = sql.replace(/\$[0-9]+/g, '?');
    const [result]: any = await pool.execute(normalizedSql, params || []);
    return {
      affectedRows: result.affectedRows || 0,
      insertId: result.insertId
    };
  } catch (error) {
    console.error('Execute error:', error);
    console.error('Execute SQL:', normalizedSql);
    if (params && params.length) console.error('Execute params:', params);
    throw error;
  }
};

export const transaction = async <T>(callback: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

export default pool;
