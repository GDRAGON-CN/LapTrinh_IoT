import { getPool } from '../config/db.js'

export async function getAllSensors() {
  const pool = getPool()
  const [rows] = await pool.query('SELECT * FROM sensor_list ORDER BY id ASC')
  return rows
}

export async function insertSensorData(sensorId, value) {
  const pool = getPool()
  const [result] = await pool.query(
    'INSERT INTO data_sensor (sensor_id, value, recorded_at) VALUES (?, ?, NOW())',
    [sensorId, value]
  )
  return result.insertId
}

export async function getLatestSensorReadings() {
  const pool = getPool()
  // Lấy bản ghi mới nhất của từng sensor
  const [rows] = await pool.query(`
    SELECT 
      s.type,
      s.unit,
      ds.value,
      ds.recorded_at
    FROM sensor_list s
    LEFT JOIN (
      SELECT ds1.*
      FROM data_sensor ds1
      INNER JOIN (
        SELECT sensor_id, MAX(recorded_at) as max_time
        FROM data_sensor
        GROUP BY sensor_id
      ) ds2 ON ds1.sensor_id = ds2.sensor_id AND ds1.recorded_at = ds2.max_time
    ) ds ON s.id = ds.sensor_id
  `)

  const result = {
    temperature: null,
    humidity: null,
    light: null,
  }

  for (const row of rows) {
    if (row.type && row.value !== null) {
      result[row.type] = {
        value: Number(row.value),
        unit: row.unit,
        recorded_at: row.recorded_at,
      }
    }
  }

  return result
}

export async function querySensorData({ type, value, time, page = 1, size = 10 }) {
  const pool = getPool()
  const offset = (Number(page) - 1) * Number(size)
  const limit = Number(size)

  let whereClauses = []
  let params = []

  if (type) {
    whereClauses.push('s.type = ?')
    params.push(type)
  }

  if (value !== undefined && value !== '') {
    whereClauses.push('ds.value = ?')
    params.push(Number(value))
  }

  if (time) {
    whereClauses.push("DATE_FORMAT(ds.recorded_at, '%Y-%m-%d %H:%i:%s') LIKE ?")
    params.push(`%${time}%`)
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

  // Đếm tổng số bản ghi
  const [countRows] = await pool.query(
    `SELECT COUNT(*) as total 
     FROM data_sensor ds
     JOIN sensor_list s ON ds.sensor_id = s.id
     ${whereSql}`,
    params
  )
  const total = countRows[0].total

  // Lấy dữ liệu phân trang
  const [rows] = await pool.query(
    `SELECT 
       ds.id,
       s.type,
       ds.value,
       s.unit,
       ds.recorded_at
     FROM data_sensor ds
     JOIN sensor_list s ON ds.sensor_id = s.id
     ${whereSql}
     ORDER BY ds.recorded_at DESC
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

export async function getSensorChartData(type, limit = 10) {
  const pool = getPool()
  const [rows] = await pool.query(
    `SELECT 
       ds.value,
       DATE_FORMAT(ds.recorded_at, '%H:%i:%s') as time,
       ds.recorded_at
     FROM data_sensor ds
     JOIN sensor_list s ON ds.sensor_id = s.id
     WHERE s.type = ?
     ORDER BY ds.recorded_at DESC
     LIMIT ?`,
    [type, Number(limit)]
  )
  // Đảo ngược lại để theo thứ tự thời gian tăng dần từ trái sang phải trên đồ thị
  return rows.reverse()
}
