import http from 'http'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Luôn nạp file .env từ đúng thư mục BE_IoT độc lập với thư mục chạy terminal
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '.env') })

// Kiểm tra biến môi trường quan trọng khi khởi động
const nodeEnv = process.env.NODE_ENV || 'development'
if (nodeEnv === 'production') {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret || jwtSecret.includes('replace_with_a_long_random_jwt_secret') || jwtSecret.length < 32) {
    console.error('❌ [Fatal Config Error]: JWT_SECRET is required, must be at least 32 characters, and cannot be a default placeholder in production.')
    process.exit(1)
  }
}

const rawPort = Number(process.env.PORT) || 3001
if (isNaN(rawPort) || rawPort <= 0 || rawPort > 65535) {
  console.error(`❌ [Fatal Config Error]: PORT must be a valid port number between 1 and 65535 (got: ${process.env.PORT})`)
  process.exit(1)
}

const PORT = rawPort
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

import { getPool } from './config/db.js'
import { getMqttClient } from './config/mqtt.js'

import { initSocket } from './config/socket.js'
import { initMqttClient } from './config/mqtt.js'
import { handleMqttMessage } from './mqtt/handler.js'
import { cleanupZombieLoadingActions } from './models/actionModel.js'
import { errorHandler } from './middleware/errorHandler.js'

import healthRoutes from './routes/health.routes.js'
import authRoutes from './routes/auth.routes.js'
import sensorRoutes from './routes/sensor.routes.js'
import deviceRoutes from './routes/device.routes.js'
import actionRoutes from './routes/action.routes.js'

const app = express()
const server = http.createServer(app)

// 1. Middlewares cơ bản
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}))
app.use(express.json())

// 2. Đăng ký các Routes
app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/sensors', sensorRoutes)
app.use('/api/devices', deviceRoutes)
app.use('/api/actions', actionRoutes)

// 3. Global Error Handler
app.use(errorHandler)

// 4. Khởi tạo Socket.IO
initSocket(server)

// 5. Khởi tạo MQTT Client
initMqttClient(handleMqttMessage)

// 6. Khởi chạy HTTP Server
server.listen(PORT, async () => {
  console.log(`====================================================`)
  console.log(`🚀 IoT Smart Home Backend running on port ${PORT}`)
  console.log(`📡 CORS allowed origin: ${FRONTEND_ORIGIN}`)
  console.log(`⚙️ Health endpoint: http://localhost:${PORT}/api/health`)
  console.log(`====================================================`)

  // Dọn dẹp các lệnh còn treo LOADING từ phiên trước khi server vừa khởi động
  try {
    await cleanupZombieLoadingActions()
  } catch (err) {
    console.warn('[Startup] Note: Could not cleanup zombie actions (DB may not be ready yet):', err.message)
  }
})

// 7. Xử lý đóng kết nối duyên dáng (Graceful Shutdown)
function handleShutdown(signal) {
  console.log(`\n[Shutdown] Received ${signal}. Closing server resources gracefully...`)
  server.close(async () => {
    console.log('[Shutdown] HTTP & Socket.IO server closed.')

    // Đóng kết nối MQTT
    const mqttClient = getMqttClient()
    if (mqttClient) {
      mqttClient.end(false, () => {
        console.log('[Shutdown] MQTT client disconnected.')
      })
    }

    // Đóng MySQL Connection Pool
    try {
      const pool = getPool()
      await pool.end()
      console.log('[Shutdown] MySQL pool closed.')
    } catch (err) {
      console.warn('[Shutdown] Error closing MySQL pool:', err.message)
    }

    process.exit(0)
  })
}

process.on('SIGINT', () => handleShutdown('SIGINT'))
process.on('SIGTERM', () => handleShutdown('SIGTERM'))
