import { getAllSensors, getLatestSensorReadings, querySensorData, getSensorChartData } from '../models/sensorModel.js'

export async function listSensors() {
  return getAllSensors()
}

export async function getLatestReadings() {
  return getLatestSensorReadings()
}

export async function getSensorHistory(queryParams) {
  return querySensorData(queryParams)
}

export async function getChartData(type, limit = 10) {
  if (!['temperature', 'humidity', 'light'].includes(type)) {
    throw { status: 400, message: 'Invalid sensor type. Allowed: temperature, humidity, light' }
  }
  return getSensorChartData(type, limit)
}
