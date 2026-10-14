import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'
import { apiRegister } from '../services/api'
import './Register.css'

export default function Register(props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const data = await apiRegister({ name, email, password })
      props.onAuth(data.user)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Registration failed.')
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

        <h2>Create an account</h2>
        <p className="auth-sub">Sign up to monitor your home in real time</p>

        {error && <div className="auth-err">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

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
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <label>Confirm Password</label>
          <input
            type="password"
            placeholder="Re-enter your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-foot">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}
