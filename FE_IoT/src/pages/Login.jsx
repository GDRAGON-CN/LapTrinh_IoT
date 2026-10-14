import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'
import { apiLogin } from '../services/api'
import './Login.css'

export default function Login(props) {
  const [email, setEmail] = useState('giang@gmail.com')
  const [password, setPassword] = useState('123456')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await apiLogin(email, password)
      props.onAuth(data.user)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Incorrect email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-logo">
            <Home size={20} />
          </span>
          <span>Smart Home</span>
        </div>

        <h2>Welcome back</h2>
        <p className="auth-sub">Log in to manage your devices and sensors</p>

        {error && <div className="auth-err">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="auth-foot">
          Do not have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
