import { useState, useEffect } from 'react'
import { Search, Zap, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import Pager from '../components/Pager'
import { apiGetActions } from '../services/api'
import './History.css'

function StatusBadge(props) {
  if (props.status === 'LOADING') {
    return (
      <span className="pill sm pill--loading">
        <Loader2 size={12} className="spin" /> Loading
      </span>
    )
  }
  if (props.status === 'FAILED') {
    return (
      <span className="pill sm pill--failed">
        <XCircle size={12} /> Failed
      </span>
    )
  }
  return (
    <span className="pill sm">
      <CheckCircle2 size={12} /> Finish
    </span>
  )
}

function getActionClass(action) {
  if (action === 'ON') {
    return 'ok'
  }
  return 'bad'
}

export default function History() {
  const [time, setTime] = useState('')
  const [device, setDevice] = useState('')
  const [action, setAction] = useState('')
  const [status, setStatus] = useState('')

  const [applied, setApplied] = useState({
    time: '',
    device: '',
    action: '',
    status: '',
  })

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)

  async function fetchHistory() {
    setLoading(true)
    try {
      const res = await apiGetActions({
        device: applied.device,
        action: applied.action,
        status: applied.status,
        time: applied.time,
        page,
        size: pageSize,
      })
      if (res && res.data) {
        setRows(res.data)
        setTotal(res.total)
      }
    } catch (err) {
      console.warn('Failed to fetch action history:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [applied, page, pageSize])

  function handleSearch(e) {
    e.preventDefault()
    setApplied({
      time: time.trim(),
      device: device.trim(),
      action: action.trim(),
      status: status.trim(),
    })
    setPage(1)
  }

  function handleReset() {
    setTime('')
    setDevice('')
    setAction('')
    setStatus('')
    setApplied({ time: '', device: '', action: '', status: '' })
    setPage(1)
  }

  return (
    <div className="panel hist-page">
      <div className="hist-head">
        <div>
          <h2>Action History</h2>
          <small className="muted">
            Audit log of all manual and automated device commands ({total} total actions)
          </small>
        </div>
      </div>

      <form className="hist-filter-card" onSubmit={handleSearch}>
        <div className="hist-form-grid">
          <div>
            <label className="muted">Device</label>
            <select value={device} onChange={(e) => setDevice(e.target.value)}>
              <option value="">All Devices</option>
              <option value="LED 1">LED 1</option>
              <option value="LED 2">LED 2</option>
              <option value="LED 3">LED 3</option>
            </select>
          </div>

          <div>
            <label className="muted">Action</label>
            <select value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="">All Actions</option>
              <option value="ON">Turn On</option>
              <option value="OFF">Turn Off</option>
            </select>
          </div>

          <div>
            <label className="muted">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="FINISH">Finish</option>
              <option value="LOADING">Loading</option>
              <option value="FAILED">Failed</option>
            </select>
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

        <div className="hist-filter-actions">
          <button type="submit" className="btn sm ok" disabled={loading}>
            <Search size={14} /> Search
          </button>
          <button type="button" className="btn sm" onClick={handleReset} disabled={loading}>
            Reset Filter
          </button>
        </div>
      </form>

      <div className="hist-table-wrap">
        <table className="hist-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Device</th>
              <th>User</th>
              <th>Action</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  Loading action history...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  No action records found
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const formattedTime = new Date(row.time)
                  .toISOString()
                  .replace('T', ' ')
                  .slice(0, 19)

                return (
                  <tr key={row.id}>
                    <td><b>#{row.id}</b></td>
                    <td>
                      <span className="hist-dev-name">
                        <Zap size={14} />
                        {row.device}
                      </span>
                    </td>
                    <td>{row.user}</td>
                    <td>
                      <span className={'hist-action ' + getActionClass(row.action)}>
                        Turn {row.action}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={row.status} />
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
