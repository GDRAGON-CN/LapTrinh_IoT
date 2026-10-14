import jwt from 'jsonwebtoken'

export function authenticate(req, res, next) {
  const authHeader = req.headers['authorization']
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header is missing' })
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Invalid authorization format. Must be: Bearer <token>' })
  }

  const token = parts[1]
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'fallback_secret_key_iot_123456789_dev')
  if (!secret) {
    return res.status(500).json({ message: 'Server configuration error: JWT_SECRET is missing' })
  }

  try {
    const decoded = jwt.verify(token, secret)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Token is invalid or has expired' })
  }
}
