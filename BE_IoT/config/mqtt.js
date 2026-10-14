import mqtt from 'mqtt'

let mqttClient = null
let isConnected = false

export function initMqttClient(onMessageHandler) {
  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://127.0.0.1:1883'
  const baseClientId = process.env.MQTT_CLIENT_ID || 'iot_backend_service'
  const options = {
    clientId: baseClientId + '_' + Math.random().toString(16).substring(2, 8),
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 5000,
  }

  if (process.env.MQTT_USERNAME) {
    options.username = process.env.MQTT_USERNAME
  }
  if (process.env.MQTT_PASSWORD) {
    options.password = process.env.MQTT_PASSWORD
  }

  mqttClient = mqtt.connect(brokerUrl, options)

  mqttClient.on('connect', () => {
    isConnected = true
    console.log(`[MQTT] Connected to broker: ${brokerUrl}`)

    // Subscribe các topic theo cấu hình
    const topics = [
      process.env.MQTT_TOPIC_SENSOR_DATA || 'sensor/data',
      process.env.MQTT_TOPIC_DEVICE_STATUS || 'device/status',
      process.env.MQTT_TOPIC_ESP32_STATUS || 'esp32/status',
    ]

    mqttClient.subscribe(topics, (err) => {
      if (err) {
        console.error('[MQTT] Subscription error:', err)
      } else {
        console.log(`[MQTT] Subscribed to topics: ${topics.join(', ')}`)
      }
    })
  })

  mqttClient.on('error', (err) => {
    console.error('[MQTT] Connection error:', err.message)
  })

  mqttClient.on('close', () => {
    isConnected = false
  })

  if (onMessageHandler) {
    mqttClient.on('message', (topic, message, packet) => {
      try {
        onMessageHandler(topic, message.toString(), packet)
      } catch (err) {
        console.error('[MQTT] Error inside message callback:', err)
      }
    })
  }

  return mqttClient
}

export function getMqttClient() {
  return mqttClient
}

export function isMqttConnected() {
  return isConnected
}

export function publishMqtt(topic, payload) {
  return new Promise((resolve, reject) => {
    if (!mqttClient || !isConnected) {
      return reject(new Error('MQTT client is not connected to broker'))
    }
    mqttClient.publish(topic, payload, { qos: 0 }, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}
