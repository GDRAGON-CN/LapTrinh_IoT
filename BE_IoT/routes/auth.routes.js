import { Router } from 'express'
import { login, register, me, updateProfile, updatePassword } from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/login', login)
router.post('/register', register)
router.get('/me', authenticate, me)
router.put('/profile', authenticate, updateProfile)
router.put('/password', authenticate, updatePassword)

export default router
