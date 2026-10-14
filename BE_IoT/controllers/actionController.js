import { queryActions } from '../models/actionModel.js'

export async function getActions(req, res, next) {
  try {
    const { device, action, status, time, page = 1, size = 10 } = req.query
    const result = await queryActions({ device, action, status, time, page, size })
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}
