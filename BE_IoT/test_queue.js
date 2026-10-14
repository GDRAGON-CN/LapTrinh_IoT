import assert from 'assert'

console.log('--- STARTING UNIT TESTS FOR COMMAND QUEUE & LATE MESSAGE LOGIC ---')

// Mock Command Queue Model
class MockCommandQueue {
  constructor() {
    this.currentPending = null
    this.commandSequence = 0
  }

  sendCommand(requestId, deviceName, action) {
    this.commandSequence += 1
    const seq = this.commandSequence
    this.currentPending = {
      requestId,
      deviceName,
      action,
      seq,
    }
    return seq
  }

  handleTimeout() {
    // Hủy pending khi timeout
    this.currentPending = null
  }

  handleStatusMessage(statusMap) {
    if (!this.currentPending) {
      return { handled: false, reason: 'NO_PENDING_COMMAND' }
    }
    const { requestId, deviceName, action } = this.currentPending
    if (statusMap[deviceName] && statusMap[deviceName].toUpperCase() === action.toUpperCase()) {
      const resolved = { handled: true, requestId, status: 'FINISH' }
      this.currentPending = null
      return resolved
    }
    return { handled: false, reason: 'STATE_MISMATCH' }
  }
}

// 1. Test lệnh thông thường khớp trạng thái
{
  const queue = new MockCommandQueue()
  queue.sendCommand('req-1', 'LED 1', 'ON')
  const res = queue.handleStatusMessage({ 'LED 1': 'ON', 'LED 2': 'OFF', 'LED 3': 'OFF' })
  assert.strictEqual(res.handled, true)
  assert.strictEqual(res.status, 'FINISH')
  console.log('✓ Test 1 Passed: Normal command confirmed with FINISH')
}

// 2. Test bản tin đến trễ sau khi đã timeout
{
  const queue = new MockCommandQueue()
  queue.sendCommand('req-1', 'LED 1', 'ON')
  // Giả lập xảy ra timeout (5s)
  queue.handleTimeout()
  // Bản tin cũ của lệnh 1 bây giờ mới đến
  const lateRes = queue.handleStatusMessage({ 'LED 1': 'ON', 'LED 2': 'OFF', 'LED 3': 'OFF' })
  assert.strictEqual(lateRes.handled, false)
  assert.strictEqual(lateRes.reason, 'NO_PENDING_COMMAND')
  console.log('✓ Test 2 Passed: Late status message after timeout is safely ignored, preventing false FINISH')
}

// 3. Test ngăn chặn gán nhầm cho lệnh mới
{
  const queue = new MockCommandQueue()
  queue.sendCommand('req-1', 'LED 1', 'ON')
  queue.handleTimeout() // Lệnh 1 timeout

  // Người dùng gửi lệnh mới cho LED 2
  queue.sendCommand('req-2', 'LED 2', 'ON')

  // Đúng lúc này bản tin cũ của LED 1 đến
  const lateResForLed1 = queue.handleStatusMessage({ 'LED 1': 'ON', 'LED 2': 'OFF', 'LED 3': 'OFF' })
  assert.strictEqual(lateResForLed1.handled, false)
  assert.strictEqual(lateResForLed1.reason, 'STATE_MISMATCH')
  assert.notStrictEqual(queue.currentPending, null, 'Pending command for LED 2 must remain intact')
  console.log('✓ Test 3 Passed: Late message for LED 1 cannot accidentally confirm pending command for LED 2')
}

console.log('🎉 ALL 3 COMMAND QUEUE TESTS PASSED SUCCESSFULLY!')
