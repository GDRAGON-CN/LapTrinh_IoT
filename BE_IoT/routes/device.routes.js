import { Router } from 'express'
import { getDevices, controlDevice, controlAll, controlRandom } from '../controllers/deviceController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', authenticate, getDevices)
router.post('/:id/control', authenticate, controlDevice)
router.post('/control/all', authenticate, controlAll)
router.post('/control/random', authenticate, controlRandom)

export default router
