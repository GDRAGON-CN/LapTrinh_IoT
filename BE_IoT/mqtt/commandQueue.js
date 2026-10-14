import { publishMqtt } from '../config/mqtt.js'
import { updateDeviceStatus, updateAllLedsStatus } from '../models/deviceModel.js'
import { updateActionStatus } from '../models/actionModel.js'
import { emitEvent } from '../config/socket.js'

const TIMEOUT_MS = Number(process.env.MQTT_COMMAND_TIMEOUT_MS) || 5000
const TOPIC_DEVICE = process.env.MQTT_TOPIC_DEVICE || 'device'

class DeviceCommandQueue {
  constructor() {
    this.queue = [] // Các job cần chạy: { isGroup, actions: [ { requestId, deviceId, deviceName, action, expectedStatus } ], onComplete }
    this.isProcessing = false
    this.currentPending = null // { requestId, deviceId, action, timer, resolve, reject }
  }

  // Đưa một lệnh đơn lẻ vào hàng đợi
  enqueueSingle({ requestId, deviceId, deviceName, action }) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        isGroup: false,
        actions: [{ requestId, deviceId, deviceName, action }],
        resolve,
        reject,
      })
      this.processNext()
    })
  }

  // Đưa một nhóm lệnh (All ON/OFF hoặc Random) vào hàng đợi với Mutex khóa nhóm
  enqueueGroup({ groupRequestId, actions }) {
    // actions: [{ requestId, deviceId, deviceName, action }]
    return new Promise((resolve, reject) => {
      this.queue.push({
        isGroup: true,
        groupRequestId,
        actions,
        resolve,
        reject,
      })
      this.processNext()
    })
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    this.isProcessing = true
    const currentJob = this.queue.shift()

    try {
      if (!currentJob.isGroup) {
        // Thực thi lệnh đơn lẻ
        const item = currentJob.actions[0]
        const result = await this.executeSubCommand(item)
        currentJob.resolve(result)
      } else {
        // Thực thi Group Job: chạy tuần tự các lệnh con, không cho lệnh khác xen vào
        const results = []
        let groupFailed = false

        for (let i = 0; i < currentJob.actions.length; i++) {
          const item = currentJob.actions[i]

          if (groupFailed) {
            // Bước trước thất bại -> Hủy các bước còn lại
            await updateActionStatus(item.requestId, 'FAILED', 'Aborted: Prior step in group command failed')
            emitEvent('device:action:done', {
              requestId: item.requestId,
              status: 'FAILED',
              error: 'Aborted: Prior step in group failed',
            })
            continue
          }

          try {
            const res = await this.executeSubCommand(item)
            results.push(res)
          } catch (err) {
            groupFailed = true
            results.push({ requestId: item.requestId, status: 'FAILED', error: err.message })
          }
        }

        currentJob.resolve({ groupRequestId: currentJob.groupRequestId, results })
      }
    } catch (err) {
      currentJob.reject(err)
    } finally {
      this.isProcessing = false
      this.processNext()
    }
  }

  executeSubCommand(item) {
    return new Promise(async (resolve, reject) => {
      const { requestId, deviceId, deviceName, action } = item

      // Xây dựng lệnh MQTT tương thích firmware hiện có: 'led1 ON', 'led2 OFF',...
      // Map tên: 'LED 1' -> 'led1', 'LED 2' -> 'led2', 'LED 3' -> 'led3'
      const ledShort = deviceName.toLowerCase().replace(/\s+/g, '') // 'led1'
      const mqttCmd = `${ledShort} ${action}`

      this.commandSequence = (this.commandSequence || 0) + 1
      const currentSeq = this.commandSequence

      // Thiết lập timeout best-effort (mặc định 5s)
      const timer = setTimeout(async () => {
        console.warn(`[CommandQueue] Timeout waiting for status confirmation: ${mqttCmd} (seq: ${currentSeq})`)
        this.currentPending = null

        await updateActionStatus(requestId, 'FAILED', `Timeout waiting for device/status confirmation (${TIMEOUT_MS}ms)`)
        emitEvent('device:action:done', {
          requestId,
          deviceId,
          action,
          status: 'FAILED',
          error: 'Timeout waiting for device/status',
        })

        reject(new Error(`Timeout waiting for confirmation (${TIMEOUT_MS}ms)`))
      }, TIMEOUT_MS)

      this.currentPending = {
        requestId,
        deviceId,
        deviceName,
        action,
        seq: currentSeq,
        timer,
        resolve,
        reject,
      }

      // Publish xuống topic 'device'
      try {
        await publishMqtt(TOPIC_DEVICE, mqttCmd)
        console.log(`[CommandQueue] Sent MQTT command: "${mqttCmd}" (requestId: ${requestId}, seq: ${currentSeq})`)
      } catch (err) {
        clearTimeout(timer)
        this.currentPending = null
        await updateActionStatus(requestId, 'FAILED', `MQTT publish error: ${err.message}`)
        emitEvent('device:action:done', {
          requestId,
          deviceId,
          action,
          status: 'FAILED',
          error: err.message,
        })
        return reject(err)
      }
    })
  }

  // Được gọi khi nhận được bản tin trên 'device/status'
  async handleDeviceStatusReceived(statusMap) {
    // statusMap dạng { 'LED 1': 'ON', 'LED 2': 'OFF', 'LED 3': 'OFF' }
    if (!this.currentPending) {
      return
    }

    const { requestId, deviceId, deviceName, action, timer, resolve } = this.currentPending
    const actualStatus = statusMap[deviceName]

    // Kiểm tra xem trạng thái của thiết bị đang chờ có khớp với action kỳ vọng không
    if (actualStatus && actualStatus.toUpperCase() === action.toUpperCase()) {
      clearTimeout(timer)
      this.currentPending = null

      // Cập nhật DB
      await updateActionStatus(requestId, 'FINISH', null)
      await updateDeviceStatus(deviceId, action)

      // Emit realtime
      emitEvent('device:action:done', {
        requestId,
        deviceId,
        action,
        status: 'FINISH',
      })
      emitEvent('device:status:update', statusMap)

      resolve({ requestId, deviceId, action, status: 'FINISH' })
    }
  }
}

export const commandQueue = new DeviceCommandQueue()
