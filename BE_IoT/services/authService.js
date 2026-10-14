import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { findUserByEmail, findUserById, createUser, updateUserProfile, updateUserPassword } from '../models/userModel.js'

function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production environment.')
    }
    return 'fallback_secret_key_iot_123456789_dev'
  }
  return secret
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

export async function loginUser(email, password) {
  if (!email || !password) {
    throw { status: 400, message: 'Email and password are required' }
  }

  const user = await findUserByEmail(email)
  if (!user) {
    throw { status: 401, message: 'Incorrect email or password' }
  }

  const isMatch = await bcrypt.compare(password, user.password_hash)
  if (!isMatch) {
    throw { status: 401, message: 'Incorrect email or password' }
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  )

  const { password_hash, ...safeUser } = user
  return { token, user: safeUser }
}

export async function registerUser({ name, email, password }) {
  if (!name || !email || !password) {
    throw { status: 400, message: 'Name, email, and password are required' }
  }

  if (password.length < 6) {
    throw { status: 400, message: 'Password must be at least 6 characters' }
  }

  const existing = await findUserByEmail(email)
  if (existing) {
    throw { status: 409, message: 'This email is already registered' }
  }

  const salt = await bcrypt.genSalt(10)
  const passwordHash = await bcrypt.hash(password, salt)

  // Đăng ký công khai: LUÔN GÁN role = 'USER', tuyệt đối không nhận role từ body
  const newId = await createUser({
    name,
    email,
    passwordHash,
    role: 'USER',
  })

  const token = jwt.sign(
    { id: newId, email, role: 'USER', name },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN }
  )

  const safeUser = await findUserById(newId)
  return { token, user: safeUser }
}

export async function getProfile(userId) {
  const user = await findUserById(userId)
  if (!user) {
    throw { status: 404, message: 'User not found' }
  }
  return user
}

export async function editProfile(userId, profileData) {
  return updateUserProfile(userId, profileData)
}

export async function changePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) {
    throw { status: 400, message: 'Current password and new password are required' }
  }

  if (newPassword.length < 6) {
    throw { status: 400, message: 'New password must be at least 6 characters' }
  }

  const poolUser = await findUserByEmail((await findUserById(userId)).email)
  const isMatch = await bcrypt.compare(currentPassword, poolUser.password_hash)
  if (!isMatch) {
    throw { status: 401, message: 'Current password is incorrect' }
  }

  const salt = await bcrypt.genSalt(10)
  const newHash = await bcrypt.hash(newPassword, salt)
  await updateUserPassword(userId, newHash)
  return { message: 'Password updated successfully' }
}
