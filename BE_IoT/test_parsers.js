import assert from 'assert'
import { parseSensorPayload, parseDeviceStatusPayload } from './mqtt/handler.js'

console.log('--- STARTING UNIT TESTS FOR MQTT PARSERS ---')

// 1. Test Sensor Parser (DHT11 & LDR ADC)
{
  const rawText1 = 'temperature: 28.5 | humidity: 81.2 | light: 1320'
  const parsed1 = parseSensorPayload(rawText1)
  assert.strictEqual(parsed1.temperature, 28.5, 'Temperature should be parsed correctly')
  assert.strictEqual(parsed1.humidity, 81.2, 'Humidity should be parsed correctly')
  assert.strictEqual(parsed1.light, 1320, 'Light ADC should be parsed correctly')
  console.log('✓ Test 1 Passed: Standard sensor string parsed successfully')
}

// 2. Test Sensor Out-of-Range Discard (Validation Guard)
{
  // Nhiệt độ 75°C (>50°C), Độ ẩm 15% (<20%), Light 5000 (>4095)
  const invalidText = 'temperature: 75.0 | humidity: 15.0 | light: 5000'
  const parsed2 = parseSensorPayload(invalidText)
  assert.strictEqual(parsed2.temperature, undefined, 'Invalid temperature must be discarded')
  assert.strictEqual(parsed2.humidity, undefined, 'Invalid humidity must be discarded')
  assert.strictEqual(parsed2.light, undefined, 'Invalid light ADC must be discarded')
  console.log('✓ Test 2 Passed: Out-of-range sensor readings properly discarded')
}

// 3. Test Sensor NaN Discard
{
  const nanText = 'temperature: nan | humidity: -999 | light: null'
  const parsed3 = parseSensorPayload(nanText)
  assert.strictEqual(parsed3.temperature, undefined, 'NaN temperature must be discarded')
  assert.strictEqual(parsed3.humidity, undefined, 'Negative humidity must be discarded')
  console.log('✓ Test 3 Passed: NaN and negative readings safely ignored')
}

// 4. Test Device Status Parser
{
  const statusText = 'LED1: ON | LED2: OFF | LED3: ON'
  const statusMap = parseDeviceStatusPayload(statusText)
  assert.strictEqual(statusMap['LED 1'], 'ON', 'LED 1 should be ON')
  assert.strictEqual(statusMap['LED 2'], 'OFF', 'LED 2 should be OFF')
  assert.strictEqual(statusMap['LED 3'], 'ON', 'LED 3 should be ON')
  console.log('✓ Test 4 Passed: Device status parsed accurately')
}

// 5. Test Device Status comma variation
{
  const commaText = 'LED1: OFF, LED2: ON, LED3: OFF'
  const statusMap = parseDeviceStatusPayload(commaText)
  assert.strictEqual(statusMap['LED 1'], 'OFF')
  assert.strictEqual(statusMap['LED 2'], 'ON')
  assert.strictEqual(statusMap['LED 3'], 'OFF')
  console.log('✓ Test 5 Passed: Comma-separated device status parsed accurately')
}

console.log('🎉 ALL 5 UNIT TESTS PASSED SUCCESSFULLY!')
