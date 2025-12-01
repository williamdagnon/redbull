import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * ✅ Vérification des variables critiques
 */
const requiredVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];

for (const v of requiredVars) {
  if (!process.env[v]) {
    console.error(`❌ Missing env variable: ${v}`);
  }
}

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
  user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD,
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  connectTimeout: 15000,    // ✅ important pour Railway
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  timezone: 'Z'
};


export const pool = mysql.createPool(dbConfig);


/**
 * ✅ Retry automatique (important pour Railway)
 */
export const testConnection = async (retries = 5): Promise<boolean> => {
  try {
    console.log("🔄 Testing MySQL connection...");
    const conn = await pool.getConnection();
    await conn.query('SELECT 1');
    conn.release();
    console.log('✅ MySQL connection established');
    return true;

  } catch (error: any) {
    console.error('❌ MySQL connection failed:', error.message);

    if (retries <= 0) {
      console.error("🔥 MySQL unreachable after several retries");
      throw error;
    }

    console.log(`Retrying... (${retries}) in 3s`);
    await new Promise(res => setTimeout(res, 3000));
    return testConnection(retries - 1);
  }
};


/**
 * ========================
 * CORE QUERY FUNCTIONS
 * ========================
 */

export const query = async <T = any>(sql: string, params?: any[]): Promise<T[]> => {
  let normalizedSql = sql;

  try {
    normalizedSql = sql.replace(/\$[0-9]+/g, '?');
    const [rows] = await pool.query(normalizedSql, params || []);
    return rows as T[];

  } catch (error) {
    console.error('❌ Query error:', error);
    console.error('SQL:', normalizedSql);
    if (params?.length) console.error('Params:', params);
    throw error;
  }
};


export const queryOne = async <T = any>(sql: string, params?: any[]): Promise<T | null> => {
  const rows = await query<T>(sql, params || []);
  return rows.length ? rows[0] : null;
};


export const execute = async (
  sql: string,
  params?: any[]
): Promise<{ affectedRows: number; insertId?: string | number }> => {

  let normalizedSql = sql;

  try {
    normalizedSql = sql.replace(/\$[0-9]+/g, '?');
    const [result]: any = await pool.execute(normalizedSql, params || []);

    return {
      affectedRows: result.affectedRows || 0,
      insertId: result.insertId
    };

  } catch (error) {
    console.error('❌ Execute error:', error);
    console.error('SQL:', normalizedSql);
    if (params?.length) console.error('Params:', params);
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
    console.error('❌ Transaction failed, rollback executed');
    throw error;

  } finally {
    conn.release();
  }
};


export default pool;
