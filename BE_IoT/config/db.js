import mysql from 'mysql2/promise'

let pool = null

export function getPool() {
  if (!pool) {
    const dbPort = Number(process.env.DB_PORT) || 3306
    const connectionLimit = Number(process.env.DB_CONNECTION_LIMIT) || 10

    pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: dbPort,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'smart_home_db',
      waitForConnections: true,
      connectionLimit: connectionLimit,
      queueLimit: 0,
    })
  }
  return pool
}

export async function testDbConnection() {
  try {
    const p = getPool()
    const [rows] = await p.query('SELECT 1 as connected')
    return { ok: true, message: 'MySQL connected successfully' }
  } catch (error) {
    return { ok: false, error: error.message }
  }
}
