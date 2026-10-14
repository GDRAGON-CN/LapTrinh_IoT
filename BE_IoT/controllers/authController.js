import { loginUser, registerUser, getProfile, editProfile, changePassword } from '../services/authService.js'

export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    const result = await loginUser(email, password)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body
    const result = await registerUser({ name, email, password })
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
}

export async function me(req, res, next) {
  try {
    const result = await getProfile(req.user.id)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

export async function updateProfile(req, res, next) {
  try {
    const result = await editProfile(req.user.id, req.body)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}

export async function updatePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body
    const result = await changePassword(req.user.id, current_password, new_password)
    res.status(200).json(result)
  } catch (err) {
    next(err)
  }
}
