import { Router } from 'express'
import { getSensors, getLatest, getData, getChart } from '../controllers/sensorController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// Cho phép truy cập lấy dữ liệu cảm biến
router.get('/', authenticate, getSensors)
router.get('/latest', authenticate, getLatest)
router.get('/data', authenticate, getData)
router.get('/chart', authenticate, getChart)

export default router
