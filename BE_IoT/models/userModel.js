import { getPool } from '../config/db.js'

export async function findUserByEmail(email) {
  const pool = getPool()
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email])
  return rows[0] || null
}

export async function findUserById(id) {
  const pool = getPool()
  const [rows] = await pool.query(
    'SELECT id, name, email, phone, github, figma, drawio, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
    [id]
  )
  return rows[0] || null
}

export async function createUser({ name, email, passwordHash, role = 'USER', phone = '', github = '', figma = '', drawio = '' }) {
  const pool = getPool()
  const [result] = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, phone, github, figma, drawio)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, email, passwordHash, role, phone, github, figma, drawio]
  )
  return result.insertId
}

export async function updateUserProfile(id, { name, phone, github, figma, drawio }) {
  const pool = getPool()
  await pool.query(
    `UPDATE users 
     SET name = COALESCE(?, name),
         phone = COALESCE(?, phone),
         github = COALESCE(?, github),
         figma = COALESCE(?, figma),
         drawio = COALESCE(?, drawio)
     WHERE id = ?`,
    [name, phone, github, figma, drawio, id]
  )
  return findUserById(id)
}

export async function updateUserPassword(id, passwordHash) {
  const pool = getPool()
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id])
}
