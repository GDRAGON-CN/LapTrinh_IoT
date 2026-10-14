import { v4 as uuidv4 } from 'uuid'
import { getAllDevices, getDeviceById } from '../models/deviceModel.js'
import { createAction } from '../models/actionModel.js'
import { commandQueue } from '../mqtt/commandQueue.js'

export async function listAllDevices() {
  return getAllDevices()
}

// Điều khiển 1 LED đơn lẻ
export async function controlSingleDevice(userId, deviceId, action) {
  if (!['ON', 'OFF'].includes(action)) {
    throw { status: 400, message: "Action must be 'ON' or 'OFF'" }
  }

  const device = await getDeviceById(deviceId)
  if (!device) {
    throw { status: 404, message: 'Device not found' }
  }

  if (device.type !== 'LED') {
    throw { status: 400, message: 'Cannot directly control a non-LED device' }
  }

  const requestId = uuidv4()

  // Tạo trước bản ghi action_device với trạng thái LOADING
  await createAction({
    requestId,
    userId,
    deviceId: device.id,
    action,
    status: 'LOADING',
  })

  // Đưa vào hàng đợi tuần tự (không block HTTP response)
  commandQueue.enqueueSingle({
    requestId,
    deviceId: device.id,
    deviceName: device.name,
    action,
  }).catch((err) => {
    console.error(`[DeviceService] Error processing command ${requestId}:`, err.message)
  })

  // Trả về ngay 202 Accepted cho client
  return {
    accepted: true,
    requestId,
    deviceId: device.id,
    action,
    message: 'Command accepted and queued for execution',
  }
}

// Điều khiển All ON hoặc All OFF (Group Job)
export async function controlAllDevices(userId, action) {
  if (!['ON', 'OFF'].includes(action)) {
    throw { status: 400, message: "Action must be 'ON' or 'OFF'" }
  }

  const devices = await getAllDevices()
  const leds = devices.filter((d) => d.type === 'LED')

  if (leds.length === 0) {
    throw { status: 400, message: 'No LED devices available' }
  }

  const groupRequestId = uuidv4()
  const actions = []

  for (const led of leds) {
    const subRequestId = uuidv4()
    await createAction({
      requestId: subRequestId,
      groupRequestId,
      userId,
      deviceId: led.id,
      action,
      status: 'LOADING',
    })

    actions.push({
      requestId: subRequestId,
      deviceId: led.id,
      deviceName: led.name,
      action,
    })
  }

  // Đẩy vào hàng đợi dưới dạng Group Job (khóa Mutex nhóm)
  commandQueue.enqueueGroup({
    groupRequestId,
    actions,
  }).catch((err) => {
    console.error(`[DeviceService] Error processing group command ${groupRequestId}:`, err.message)
  })

  return {
    accepted: true,
    groupRequestId,
    totalCommands: actions.length,
    actions,
    message: `Group command (${action} all) accepted and queued`,
  }
}

// Điều khiển Random: Backend tự chọn ngẫu nhiên 1 LED bật và tắt các LED còn lại
export async function controlRandomDevice(userId) {
  const devices = await getAllDevices()
  const leds = devices.filter((d) => d.type === 'LED')

  if (leds.length === 0) {
    throw { status: 400, message: 'No LED devices available' }
  }

  // Backend là Single Source of Truth: Chọn ngẫu nhiên 1 LED
  const chosenIndex = Math.floor(Math.random() * leds.length)
  const chosenLed = leds[chosenIndex]

  const groupRequestId = uuidv4()
  const actions = []

  for (let i = 0; i < leds.length; i++) {
    const led = leds[i]
    const action = i === chosenIndex ? 'ON' : 'OFF'
    const subRequestId = uuidv4()

    await createAction({
      requestId: subRequestId,
      groupRequestId,
      userId,
      deviceId: led.id,
      action,
      status: 'LOADING',
    })

    actions.push({
      requestId: subRequestId,
      deviceId: led.id,
      deviceName: led.name,
      action,
    })
  }

  commandQueue.enqueueGroup({
    groupRequestId,
    actions,
  }).catch((err) => {
    console.error(`[DeviceService] Error processing random group command ${groupRequestId}:`, err.message)
  })

  return {
    accepted: true,
    groupRequestId,
    chosenDeviceId: chosenLed.id,
    chosenDeviceName: chosenLed.name,
    actions,
    message: 'Random sequence accepted and queued',
  }
}
