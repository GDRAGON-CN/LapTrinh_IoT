import { listSensors, getLatestReadings, getSensorHistory, getChartData } from '../services/sensorService.js'

export async function getSensors(req, res, next) {
  try {
    const data = await listSensors()
    res.status(200).json(data)
  } catch (err) {
    next(err)
  }
}

export async function getLatest(req, res, next) {
  try {
    const data = await getLatestReadings()
    res.status(200).json(data)
  } catch (err) {
    next(err)
  }
}

export async function getData(req, res, next) {
  try {
    const { type, value, time, page, size } = req.query
    const result = await getSensorHistory({ type, value, time, page, size })
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

export async function getChart(req, res, next) {
  try {
    const { type = 'temperature', limit = 10 } = req.query
    const result = await getChartData(type, limit)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}
