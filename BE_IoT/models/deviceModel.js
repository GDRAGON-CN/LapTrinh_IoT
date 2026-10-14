import { getPool } from '../config/db.js'

export async function getAllDevices() {
  const pool = getPool()
  // Trả về danh sách LED kèm alias controller_is_online từ parent Controller
  const [rows] = await pool.query(`
    SELECT 
      d.id,
      d.name,
      d.type,
      d.gpio_pin,
      d.room,
      d.status,
      c.is_online AS controller_is_online
    FROM device_list d
    LEFT JOIN device_list c ON d.parent_id = c.id
    WHERE d.type = 'LED'
    ORDER BY d.id ASC
  `)
  return rows
}

export async function getDeviceById(id) {
  const pool = getPool()
  const [rows] = await pool.query(
    'SELECT * FROM device_list WHERE id = ? LIMIT 1',
    [id]
  )
  return rows[0] || null
}

export async function updateDeviceStatus(id, status) {
  const pool = getPool()
  await pool.query(
    'UPDATE device_list SET status = ?, updated_at = NOW() WHERE id = ?',
    [status, id]
  )
}

export async function updateAllLedsStatus(status) {
  const pool = getPool()
  await pool.query(
    "UPDATE device_list SET status = ?, updated_at = NOW() WHERE type = 'LED'",
    [status]
  )
}

export async function setControllerOnline(isOnline) {
  const pool = getPool()
  await pool.query(
    "UPDATE device_list SET is_online = ?, updated_at = NOW() WHERE type = 'CONTROLLER'",
    [isOnline ? 1 : 0]
  )
}

export async function getController() {
  const pool = getPool()
  const [rows] = await pool.query(
    "SELECT * FROM device_list WHERE type = 'CONTROLLER' LIMIT 1"
  )
  return rows[0] || null
}
