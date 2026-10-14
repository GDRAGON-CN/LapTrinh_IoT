import { getPool } from '../config/db.js'

export async function createAction({ requestId, groupRequestId = null, userId, deviceId, action, status = 'LOADING' }) {
  const pool = getPool()
  const [result] = await pool.query(
    `INSERT INTO action_device (request_id, group_request_id, user_id, device_id, action, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [requestId, groupRequestId, userId, deviceId, action, status]
  )
  return result.insertId
}

export async function updateActionStatus(requestId, status, errorMessage = null) {
  const pool = getPool()
  await pool.query(
    `UPDATE action_device 
     SET status = ?, 
         error_message = ?, 
         finished_at = NOW() 
     WHERE request_id = ?`,
    [status, errorMessage, requestId]
  )
}

export async function queryActions({ device, action, status, time, page = 1, size = 10 }) {
  const pool = getPool()
  const offset = (Number(page) - 1) * Number(size)
  const limit = Number(size)

  let whereClauses = []
  let params = []

  if (device) {
    whereClauses.push('d.name = ?')
    params.push(device)
  }

  if (action) {
    whereClauses.push('a.action = ?')
    params.push(action)
  }

  if (status) {
    whereClauses.push('a.status = ?')
    params.push(status)
  }

  if (time) {
    whereClauses.push("DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i:%s') LIKE ?")
    params.push(`%${time}%`)
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

  const [countRows] = await pool.query(
    `SELECT COUNT(*) as total 
     FROM action_device a
     JOIN device_list d ON a.device_id = d.id
     JOIN users u ON a.user_id = u.id
     ${whereSql}`,
    params
  )
  const total = countRows[0].total

  const [rows] = await pool.query(
    `SELECT 
       a.id,
       a.request_id,
       a.group_request_id,
       d.name as device,
       u.name as user,
       a.action,
       a.status,
       a.error_message,
       a.created_at as time,
       a.finished_at
     FROM action_device a
     JOIN device_list d ON a.device_id = d.id
     JOIN users u ON a.user_id = u.id
     ${whereSql}
     ORDER BY a.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  return {
    data: rows,
    total,
    page: Number(page),
    size: Number(size),
  }
}

export async function cleanupZombieLoadingActions() {
  const pool = getPool()
  const [result] = await pool.query(
    `UPDATE action_device 
     SET status = 'FAILED', 
         error_message = 'Backend restarted while action was pending', 
         finished_at = NOW() 
     WHERE status = 'LOADING'`
  )
  if (result.affectedRows > 0) {
    console.log(`[ActionCleanup] Cleaned up ${result.affectedRows} zombie LOADING actions`)
  }
}
