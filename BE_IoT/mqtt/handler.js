import { insertSensorData, getAllSensors } from '../models/sensorModel.js'
import { setControllerOnline, updateDeviceStatus, getAllDevices } from '../models/deviceModel.js'
import { emitEvent } from '../config/socket.js'
import { commandQueue } from './commandQueue.js'
import { publishMqtt } from '../config/mqtt.js'

let lastMessageTime = null
const SENSOR_STALE_MS = Number(process.env.SENSOR_STALE_MS) || 15000

// Parser sensor/data: "temperature: 28 | humidity: 81 | light: 1320"
// Hoặc các biến thể khoảng trắng
export function parseSensorPayload(payloadStr) {
  const result = {}

  // Regex linh hoạt bắt: temperature/temp, humidity/hum, light
  const tempMatch = payloadStr.match(/temperature\s*:\s*([\d.]+)/i)
  const humMatch = payloadStr.match(/humidity\s*:\s*([\d.]+)/i)
  const lightMatch = payloadStr.match(/light\s*:\s*([\d.]+)/i)

  if (tempMatch) {
    const val = parseFloat(tempMatch[1])
    // Validation dải kỹ thuật DHT11: 0 - 50 °C
    if (!isNaN(val) && val >= 0 && val <= 50) {
      result.temperature = val
    }
  }

  if (humMatch) {
    const val = parseFloat(humMatch[1])
    // Validation dải kỹ thuật DHT11: 20 - 90 % RH
    if (!isNaN(val) && val >= 20 && val <= 90) {
      result.humidity = val
    }
  }

  if (lightMatch) {
    const val = parseFloat(lightMatch[1])
    // Validation dải ADC 12-bit thô ESP32: 0 - 4095
    if (!isNaN(val) && val >= 0 && val <= 4095) {
      result.light = val
    }
  }

  return result
}

// Parser device/status: "LED1: ON | LED2: OFF | LED3: ON" hoặc "LED1: ON, LED2: OFF, LED3: ON"
export function parseDeviceStatusPayload(payloadStr) {
  const result = {}
  // Bắt các cặp LED[1-3]: ON|OFF
  const regex = /LED\s*(\d)\s*:\s*(ON|OFF)/gi
  let match
  while ((match = regex.exec(payloadStr)) !== null) {
    const ledNum = match[1]
    const state = match[2].toUpperCase()
    result[`LED ${ledNum}`] = state
  }
  return result
}

export async function handleMqttMessage(topic, payload, packet) {
  console.log(`[MQTT Handler] Received message on topic [${topic}]: ${payload}`)
  lastMessageTime = Date.now()

  const topicSensorData = process.env.MQTT_TOPIC_SENSOR_DATA || 'sensor/data'
  const topicDeviceStatus = process.env.MQTT_TOPIC_DEVICE_STATUS || 'device/status'
  const topicEsp32Status = process.env.MQTT_TOPIC_ESP32_STATUS || 'esp32/status'

  try {
    // 1. Xử lý dữ liệu cảm biến
    if (topic === topicSensorData) {
      const parsed = parseSensorPayload(payload)
      const hasAnyValid = Object.keys(parsed).length > 0

      if (hasAnyValid) {
        // Lưu vào MySQL an toàn, không để lỗi DB làm crash MQTT
        try {
          const sensors = await getAllSensors()
          const sensorMap = {}
          for (const s of sensors) {
            sensorMap[s.type] = s.id
          }

          if (parsed.temperature !== undefined && sensorMap.temperature) {
            await insertSensorData(sensorMap.temperature, parsed.temperature)
          }
          if (parsed.humidity !== undefined && sensorMap.humidity) {
            await insertSensorData(sensorMap.humidity, parsed.humidity)
          }
          if (parsed.light !== undefined && sensorMap.light) {
            await insertSensorData(sensorMap.light, parsed.light)
          }
        } catch (dbErr) {
          console.error('[MQTT Handler] Error saving sensor data to DB:', dbErr.message)
        }

        // Bắn Socket.IO realtime
        emitEvent('sensor:new', {
          temperature: parsed.temperature ?? null,
          humidity: parsed.humidity ?? null,
          light: parsed.light ?? null,
          time: new Date().toTimeString().slice(0, 8),
          recorded_at: new Date(),
        })
      }
    }

    // 2. Xử lý phản hồi trạng thái LED
    else if (topic === topicDeviceStatus) {
      // Bỏ qua retained message cũ nếu có
      if (packet && packet.retain) {
        console.log('[MQTT Handler] Skipping retained device/status packet')
        return
      }

      const statusMap = parseDeviceStatusPayload(payload)
      if (Object.keys(statusMap).length > 0) {
        // Chuyển cho commandQueue để đối chiếu lệnh pending
        await commandQueue.handleDeviceStatusReceived(statusMap)

        // Đồng bộ cập nhật device_list trong database
        try {
          const devices = await getAllDevices()
          for (const dev of devices) {
            if (statusMap[dev.name]) {
              await updateDeviceStatus(dev.id, statusMap[dev.name])
            }
          }
        } catch (dbErr) {
          console.error('[MQTT Handler] Error updating device_list in DB:', dbErr.message)
        }
      }
    }

    // 3. Xử lý trạng thái kết nối ESP32 (LWT / Online message)
    else if (topic === topicEsp32Status) {
      const statusText = payload.trim().toLowerCase()
      if (statusText === 'online') {
        await setControllerOnline(true)
        emitEvent('esp32:status:change', { isOnline: true, status: 'ONLINE' })

        // Gửi lệnh "all" để truy vấn trạng thái đồng bộ ban đầu mà không tạo action history giả
        try {
          const topicDevice = process.env.MQTT_TOPIC_DEVICE || 'device'
          await publishMqtt(topicDevice, 'all')
          console.log('[MQTT Handler] Sent "all" query command after ESP32 online')
        } catch (err) {
          console.warn('[MQTT Handler] Failed to send "all" query:', err.message)
        }
      } else if (statusText === 'offline') {
        await setControllerOnline(false)
        emitEvent('esp32:status:change', { isOnline: false, status: 'OFFLINE' })
      }
    }
  } catch (err) {
    console.error('[MQTT Handler] Unexpected error handling message:', err)
  }
}

// Hàm kiểm tra ESP32 có dữ liệu gần đây không (Stale check)
export function getEsp32ConnectionStatus() {
  if (!lastMessageTime) {
    return { status: 'UNKNOWN', message: 'No messages received yet' }
  }
  const diff = Date.now() - lastMessageTime
  if (diff > SENSOR_STALE_MS) {
    return { status: 'STALE', message: 'No recent data from ESP32', lastSeenSecondsAgo: Math.round(diff / 1000) }
  }
  return { status: 'ACTIVE', message: 'Receiving data normally', lastSeenSecondsAgo: Math.round(diff / 1000) }
}
