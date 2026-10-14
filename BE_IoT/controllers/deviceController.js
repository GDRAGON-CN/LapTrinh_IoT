import { listAllDevices, controlSingleDevice, controlAllDevices, controlRandomDevice } from '../services/deviceService.js'

export async function getDevices(req, res, next) {
  try {
    const devices = await listAllDevices()
    res.status(200).json(devices)
  } catch (err) {
    next(err)
  }
}

export async function controlDevice(req, res, next) {
  try {
    const { id } = req.params
    const { action } = req.body
    const userId = req.user.id
    const result = await controlSingleDevice(userId, Number(id), action)
    res.status(202).json(result)
  } catch (err) {
    next(err)
  }
}

export async function controlAll(req, res, next) {
  try {
    const { action } = req.body
    const userId = req.user.id
    const result = await controlAllDevices(userId, action)
    res.status(202).json(result)
  } catch (err) {
    next(err)
  }
}

export async function controlRandom(req, res, next) {
  try {
    const userId = req.user.id
    const result = await controlRandomDevice(userId)
    res.status(202).json(result)
  } catch (err) {
    next(err)
  }
}
