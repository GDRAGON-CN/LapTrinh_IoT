import { useState, useEffect } from 'react'
import { Search, Activity, Thermometer, Droplets, Sun } from 'lucide-react'
import Pager from '../components/Pager'
import { apiGetSensorData } from '../services/api'
import './DataSensor.css'

const SENSOR_TYPES = {
  temperature: {
    label: 'Temperature Sensor',
    unit: '°C',
    color: 'red',
  },
  humidity: {
    label: 'Humidity Sensor',
    unit: '% RH',
    color: 'blue',
  },
  light: {
    label: 'Light Sensor',
    unit: 'ADC',
    color: 'orange',
  },
}

function getTypeFromUnit(text) {
  const lower = text.toLowerCase()
  if (lower.includes('°c')) {
    return 'temperature'
  }
  if (lower.includes('%')) {
    return 'humidity'
  }
  if (lower.includes('adc') || lower.includes('lux')) {
    return 'light'
  }
  return ''
}

function SensorIcon(props) {
  if (props.type === 'temperature') {
    return <Thermometer size={14} />
  }
  if (props.type === 'humidity') {
    return <Droplets size={14} />
  }
  return <Sun size={14} />
}

export default function DataSensor() {
  const [type, setType] = useState('')
  const [value, setValue] = useState('')
  const [time, setTime] = useState('')

  const [applied, setApplied] = useState({ type: '', value: '', time: '' })

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const [timeError, setTimeError] = useState('')

  async function fetchData() {
    setLoading(true)
    try {
      const res = await apiGetSensorData({
        type: applied.type,
        value: applied.value,
        time: applied.time,
        page,
        size: pageSize,
      })
      if (res && res.data) {
        setRows(res.data)
        setTotal(res.total)
      }
    } catch (err) {
      console.warn('Failed to fetch sensor data:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [applied, page, pageSize])

  function handleSearch(e) {
    e.preventDefault()
    setTimeError('')

    let searchType = type
    if (searchType === '' && value.trim() !== '') {
      searchType = getTypeFromUnit(value)
    }

    setApplied({
      type: searchType,
      value: value.trim(),
      time: time.trim(),
    })
    setPage(1)
  }

  function handleReset() {
    setType('')
    setValue('')
    setTime('')
    setTimeError('')
    setApplied({ type: '', value: '', time: '' })
    setPage(1)
  }

  return (
    <div className="panel ds-page">
      <div className="ds-head">
        <div>
          <h2>Sensor Data History</h2>
          <small className="muted">
            Viewing records ({total} total readings)
          </small>
        </div>
      </div>

      <form className="ds-filter-card" onSubmit={handleSearch}>
        <div className="ds-form-grid">
          <div>
            <label className="muted">Sensor Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All Sensors</option>
              <option value="temperature">Temperature (°C)</option>
              <option value="humidity">Humidity (% RH)</option>
              <option value="light">Light (ADC)</option>
            </select>
          </div>

          <div>
            <label className="muted">Value (or with unit)</label>
            <input
              placeholder="e.g. 28, 80, 1300..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          <div>
            <label className="muted">Time Search</label>
            <input
              placeholder="e.g. 2026-10, 16:30..."
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        {timeError && <div className="ds-error">{timeError}</div>}

        <div className="ds-filter-actions">
          <button type="submit" className="btn sm ok" disabled={loading}>
            <Search size={14} /> Search
          </button>
          <button type="button" className="btn sm" onClick={handleReset} disabled={loading}>
            Reset Filter
          </button>
        </div>
      </form>

      <div className="ds-table-wrap">
        <table className="ds-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Sensor</th>
              <th>Type</th>
              <th>Value</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  Loading sensor readings...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  No sensor records found
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const info = SENSOR_TYPES[row.type] || {
                  label: row.type,
                  unit: row.unit || '',
                  color: 'blue',
                }
                const formattedTime = new Date(row.recorded_at)
                  .toISOString()
                  .replace('T', ' ')
                  .slice(0, 19)

                return (
                  <tr key={row.id}>
                    <td><b>#{row.id}</b></td>
                    <td>
                      <span className={'ds-badge ' + info.color}>
                        <SensorIcon type={row.type} />
                        {info.label}
                      </span>
                    </td>
                    <td>{row.type}</td>
                    <td>
                      <b>{row.value}</b> <small className="muted">{info.unit}</small>
                    </td>
                    <td>{formattedTime}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <Pager
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize)
          setPage(1)
        }}
      />
    </div>
  )
}
