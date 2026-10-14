import { useState, useEffect } from 'react'
import {
  Thermometer,
  Droplets,
  Sun,
  Lightbulb,
  RefreshCw,
  Check,
  PowerOff,
  Shuffle,
  Activity,
  Wifi,
  WifiOff,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  apiGetLatestSensors,
  apiGetSensorChart,
  apiGetDevices,
  apiControlDevice,
  apiControlAllDevices,
  apiControlRandomDevice,
} from '../services/api'
import { getSocket } from '../services/socket'
import './Dashboard.css'

const CHART_COLORS = {
  temperature: '#da1010ff',
  humidity: '#0284c7',
  light: '#d97706',
}

function StatCard(props) {
  return (
    <div className={'panel dash-stat dash-stat--' + props.color}>
      <div className="row">
        <span className={'ico ' + props.color}>{props.icon}</span>
        <span className="tag">{props.tag || 'Real-time'}</span>
      </div>
      <small>{props.title}</small>
      <b>{props.value}</b>
    </div>
  )
}

function DeviceRow(props) {
  let bulbClass = 'dash-bulb'
  let switchClass = 'dash-switch'
  if (props.on) {
    bulbClass = 'dash-bulb dash-bulb--lit'
    switchClass = 'dash-switch dash-switch--on'
  }

  return (
    <div className="dash-dev">
      <span className={bulbClass}>
        <Lightbulb size={20} />
      </span>
      <div>
        <b>{props.name}</b> <span className="tag">GPIO {props.gpio}</span>
        <small>{props.room}</small>
      </div>
      <span className={'pill sm ' + (props.pending ? 'pill--loading' : '')}>
        {props.pending ? 'Loading...' : (props.on ? 'ON' : 'OFF')}
      </span>
      <button
        className={switchClass}
        disabled={props.pending || props.disabled}
        onClick={props.onToggle}
      ></button>
    </div>
  )
}

export default function Dashboard(props) {
  // Trạng thái cảm biến
  const [latestSensors, setLatestSensors] = useState({
    temperature: null,
    humidity: null,
    light: null,
  })
  const [chartData, setChartData] = useState([])
  const [tab, setTab] = useState('temperature')

  // Trạng thái thiết bị & ESP32
  const [devices, setDevices] = useState([
    { id: 2, name: 'LED 1', gpio_pin: 2, room: 'Living Room', status: 'OFF' },
    { id: 3, name: 'LED 2', gpio_pin: 5, room: 'Bedroom', status: 'OFF' },
    { id: 4, name: 'LED 3', gpio_pin: 18, room: 'Kitchen', status: 'OFF' },
  ])
  const [esp32Online, setEsp32Online] = useState(null) // null: chưa rõ, true: online, false: offline
  const [pendingIds, setPendingIds] = useState({})
  const [loadingAction, setLoadingAction] = useState(false)

  // 1. Tải dữ liệu ban đầu
  async function loadInitialData() {
    try {
      const [sensorData, devList, chartPoints] = await Promise.all([
        apiGetLatestSensors().catch(() => null),
        apiGetDevices().catch(() => null),
        apiGetSensorChart(tab, 10).catch(() => []),
      ])

      if (sensorData) {
        setLatestSensors(sensorData)
      }
      if (devList && devList.length > 0) {
        setDevices(devList)
        if (devList[0].controller_is_online !== undefined) {
          setEsp32Online(Boolean(devList[0].controller_is_online))
        }
      }
      if (chartPoints && chartPoints.length > 0) {
        setChartData(chartPoints)
      }
    } catch (err) {
      console.warn('Initial data load warning:', err.message)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  // Tải lại chart khi đổi tab
  useEffect(() => {
    async function fetchChart() {
      try {
        const points = await apiGetSensorChart(tab, 10)
        setChartData(points)
      } catch (err) {
        console.warn('Failed to load chart for tab:', tab)
      }
    }
    fetchChart()
  }, [tab])

  // 2. Lắng nghe Realtime qua Socket.IO
  useEffect(() => {
    const socket = getSocket()

    function onSensorNew(data) {
      setLatestSensors((prev) => ({
        ...prev,
        temperature: data.temperature !== null ? { value: data.temperature, unit: '°C' } : prev.temperature,
        humidity: data.humidity !== null ? { value: data.humidity, unit: '% RH' } : prev.humidity,
        light: data.light !== null ? { value: data.light, unit: 'ADC' } : prev.light,
      }))

      // Thêm điểm vào biểu đồ nếu khớp tab hiện tại
      const currentVal = data[tab]
      if (currentVal !== null && currentVal !== undefined) {
        setChartData((prev) => {
          const next = [...prev, { time: data.time || new Date().toTimeString().slice(0, 8), value: currentVal }]
          return next.slice(-10) // Giữ tối đa 10 điểm
        })
      }
    }

    function onDeviceStatusUpdate(statusMap) {
      setDevices((prev) =>
        prev.map((dev) => {
          if (statusMap[dev.name]) {
            return { ...dev, status: statusMap[dev.name] }
          }
          return dev
        })
      )
    }

    function onActionDone(actionResult) {
      if (actionResult.deviceId) {
        setPendingIds((prev) => {
          const next = { ...prev }
          delete next[actionResult.deviceId]
          return next
        })
      }
      setLoadingAction(false)
      // Tải lại devices để đồng bộ
      apiGetDevices().then((res) => res && setDevices(res)).catch(() => {})
    }

    function onEsp32Status(data) {
      setEsp32Online(data.isOnline)
    }

    socket.on('sensor:new', onSensorNew)
    socket.on('device:status:update', onDeviceStatusUpdate)
    socket.on('device:action:done', onActionDone)
    socket.on('esp32:status:change', onEsp32Status)

    return () => {
      socket.off('sensor:new', onSensorNew)
      socket.off('device:status:update', onDeviceStatusUpdate)
      socket.off('device:action:done', onActionDone)
      socket.off('esp32:status:change', onEsp32Status)
    }
  }, [tab])

  // 3. Hàm điều khiển thiết bị
  async function toggleLed(dev) {
    const targetAction = dev.status === 'ON' ? 'OFF' : 'ON'
    setPendingIds((prev) => ({ ...prev, [dev.id]: true }))
    try {
      await apiControlDevice(dev.id, targetAction)
    } catch (err) {
      alert(err.message || 'Failed to send command')
      setPendingIds((prev) => {
        const next = { ...prev }
        delete next[dev.id]
        return next
      })
    }
  }

  async function turnAllOn() {
    setLoadingAction(true)
    try {
      await apiControlAllDevices('ON')
    } catch (err) {
      alert(err.message || 'Failed to turn all on')
      setLoadingAction(false)
    }
  }

  async function turnAllOff() {
    setLoadingAction(true)
    try {
      await apiControlAllDevices('OFF')
    } catch (err) {
      alert(err.message || 'Failed to turn all off')
      setLoadingAction(false)
    }
  }

  async function turnRandom() {
    setLoadingAction(true)
    try {
      await apiControlRandomDevice()
    } catch (err) {
      alert(err.message || 'Failed to execute random command')
      setLoadingAction(false)
    }
  }

  // Đếm số đèn đang bật
  const activeCount = devices.filter((d) => d.status === 'ON').length

  return (
    <div className="dash">
      {/* 3 thẻ chỉ số cảm biến */}
      <div className="dash-stats">
        <StatCard
          icon={<Thermometer size={20} />}
          color="red"
          title="Temperature"
          value={
            latestSensors.temperature
              ? `${latestSensors.temperature.value} °C`
              : 'No recent data'
          }
        />
        <StatCard
          icon={<Droplets size={20} />}
          color="blue"
          title="Humidity"
          value={
            latestSensors.humidity
              ? `${latestSensors.humidity.value} %`
              : 'No recent data'
          }
        />
        <StatCard
          icon={<Sun size={20} />}
          color="orange"
          title="Light (ADC)"
          value={
            latestSensors.light
              ? `${latestSensors.light.value} ADC`
              : 'No recent data'
          }
        />
      </div>

      {/* Phần dưới: Biểu đồ (trái) và Điều khiển đèn (phải) */}
      <div className="dash-main">
        {/* Khung biểu đồ */}
        <div className="panel dash-chart">
          <div className="dash-chart-head">
            <div className="row">
              <span className="ico blue">
                <Activity size={18} />
              </span>
              <div>
                <b>Sensor Analytics</b>
                <small>Real-time readings (last 10 points)</small>
              </div>
            </div>
            {/* 3 nút chuyển loại cảm biến */}
            <div className="tabs">
              <button
                className={tab === 'temperature' ? 'tab active' : 'tab'}
                onClick={() => setTab('temperature')}
              >
                Temperature
              </button>
              <button
                className={tab === 'humidity' ? 'tab active' : 'tab'}
                onClick={() => setTab('humidity')}
              >
                Humidity
              </button>
              <button
                className={tab === 'light' ? 'tab active' : 'tab'}
                onClick={() => setTab('light')}
              >
                Light
              </button>
            </div>
          </div>

          <div className="dash-chart-body">
            {chartData.length === 0 ? (
              <div style={{ display: 'flex', height: '100%', justifyContent: 'center', alignItems: 'center', color: '#94a3b8' }}>
                Waiting for incoming sensor data from ESP32...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={CHART_COLORS[tab]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Khung điều khiển đèn */}
        <div className="panel dash-ctrl">
          <div className="dash-ctrl-head">
            <div className="row">
              <span className="ico yellow">
                <Lightbulb size={18} />
              </span>
              <div>
                <b>Device Control</b>
                <small>{activeCount} of 3 active</small>
              </div>
            </div>
            <span className="pill sm">
              {esp32Online === true ? (
                <>
                  <Wifi size={12} style={{ marginRight: 4 }} /> ESP32 Online
                </>
              ) : esp32Online === false ? (
                <>
                  <WifiOff size={12} style={{ marginRight: 4 }} /> ESP32 Offline
                </>
              ) : (
                'ESP32 Unknown'
              )}
            </span>
          </div>

          {/* Danh sách 3 đèn */}
          <div className="dash-devs">
            {devices.map((dev) => (
              <DeviceRow
                key={dev.id}
                name={dev.name}
                gpio={dev.gpio_pin}
                room={dev.room}
                on={dev.status === 'ON'}
                pending={Boolean(pendingIds[dev.id])}
                disabled={loadingAction}
                onToggle={() => toggleLed(dev)}
              />
            ))}
          </div>

          {/* 3 nút thao tác nhanh */}
          <div className="dash-quick">
            <button className="btn sm ok" onClick={turnAllOn} disabled={loadingAction}>
              <Check size={14} /> All ON
            </button>
            <button className="btn sm" onClick={turnAllOff} disabled={loadingAction}>
              <PowerOff size={14} /> All OFF
            </button>
            <button className="btn sm" onClick={turnRandom} disabled={loadingAction}>
              <Shuffle size={14} /> Random
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
