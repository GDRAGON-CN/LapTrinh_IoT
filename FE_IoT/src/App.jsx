import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import DataSensor from './pages/DataSensor'
import History from './pages/History'
import Profile from './pages/Profile'
import { apiGetMe, setAuthToken, getAuthToken } from './services/api'

const SESSION_KEY = 'sh_session'

function readSession() {
  const text = localStorage.getItem(SESSION_KEY)
  if (!text) {
    return null
  }
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export default function App() {
  const [user, setUser] = useState(readSession())
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    async function verifyAuth() {
      const token = getAuthToken()
      if (token) {
        try {
          const freshUser = await apiGetMe()
          setUser(freshUser)
          localStorage.setItem(SESSION_KEY, JSON.stringify(freshUser))
        } catch {
          // Token không hợp lệ hoặc server chưa bật
          console.warn('Session verification failed, fallback to local state')
        }
      }
      setLoading(false)
    }
    verifyAuth()
  }, [])

  function handleLogout() {
    setAuthToken(null)
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
    navigate('/login')
  }

  function handleAuthSuccess(userData) {
    setUser(userData)
    localStorage.setItem(SESSION_KEY, JSON.stringify(userData))
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#64748b' }}>
        Loading application...
      </div>
    )
  }

  // Chưa đăng nhập: chỉ có trang đăng nhập và đăng ký
  if (user === null) {
    return (
      <Routes>
        <Route path="/login" element={<Login onAuth={handleAuthSuccess} />} />
        <Route path="/register" element={<Register onAuth={handleAuthSuccess} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    )
  }

  // Đã đăng nhập: hiện các trang chính bên trong Layout
  return (
    <Routes>
      <Route element={<Layout onLogout={handleLogout} />}>
        <Route path="/" element={<Dashboard user={user} />} />
        <Route path="/data-sensor" element={<DataSensor />} />
        <Route path="/history" element={<History />} />
        <Route
          path="/profile"
          element={
            <Profile user={user} onChange={handleAuthSuccess} onLogout={handleLogout} />
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
