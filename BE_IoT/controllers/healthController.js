import { testDbConnection } from '../config/db.js'
import { isMqttConnected } from '../config/mqtt.js'
import { getEsp32ConnectionStatus } from '../mqtt/handler.js'

export async function checkHealth(req, res) {
  const dbStatus = await testDbConnection()
  const mqttStatus = isMqttConnected()
  const esp32Status = getEsp32ConnectionStatus()

  const isHealthy = dbStatus.ok && mqttStatus

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    services: {
      database: dbStatus.ok ? 'CONNECTED' : `ERROR (${dbStatus.error || 'unreachable'})`,
      mqttBroker: mqttStatus ? 'CONNECTED' : 'DISCONNECTED',
      esp32DataFeed: esp32Status,
    },
  })
}
