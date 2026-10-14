import { Router } from 'express'
import { getActions } from '../controllers/actionController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, getActions)

export default router
