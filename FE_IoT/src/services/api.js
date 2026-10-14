const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

export function getAuthToken() {
  return localStorage.getItem('sh_token')
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('sh_token', token)
  } else {
    localStorage.removeItem('sh_token')
  }
}

export async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config = {
    ...options,
    headers,
  }

  const response = await fetch(url, config)

  if (response.status === 401) {
    // Token hết hạn hoặc không hợp lệ -> Xóa token
    setAuthToken(null)
    localStorage.removeItem('sh_session')
    // Nếu không phải trang login/register thì điều hướng
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      window.location.href = '/login'
    }
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`
    throw new Error(errorMsg)
  }

  return data
}

// =================== AUTH APIS ===================
export async function apiLogin(email, password) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  if (data.token) {
    setAuthToken(data.token)
  }
  return data
}

export async function apiRegister({ name, email, password }) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
  if (data.token) {
    setAuthToken(data.token)
  }
  return data
}

export async function apiGetMe() {
  return request('/auth/me')
}

export async function apiUpdateProfile(profileData) {
  return request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  })
}

export async function apiUpdatePassword(current_password, new_password) {
  return request('/auth/password', {
    method: 'PUT',
    body: JSON.stringify({ current_password, new_password }),
  })
}

// =================== SENSOR APIS ===================
export async function apiGetSensors() {
  return request('/sensors')
}

export async function apiGetLatestSensors() {
  return request('/sensors/latest')
}

export async function apiGetSensorData(params = {}) {
  const query = new URLSearchParams()
  if (params.type) query.append('type', params.type)
  if (params.value !== undefined && params.value !== '') query.append('value', params.value)
  if (params.time) query.append('time', params.time)
  if (params.page) query.append('page', params.page)
  if (params.size) query.append('size', params.size)

  const queryString = query.toString() ? `?${query.toString()}` : ''
  return request(`/sensors/data${queryString}`)
}

export async function apiGetSensorChart(type = 'temperature', limit = 10) {
  return request(`/sensors/chart?type=${type}&limit=${limit}`)
}

// =================== DEVICE APIS ===================
export async function apiGetDevices() {
  return request('/devices')
}

export async function apiControlDevice(deviceId, action) {
  return request(`/devices/${deviceId}/control`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  })
}

export async function apiControlAllDevices(action) {
  return request('/devices/control/all', {
    method: 'POST',
    body: JSON.stringify({ action }),
  })
}

export async function apiControlRandomDevice() {
  return request('/devices/control/random', {
    method: 'POST',
  })
}

// =================== ACTION HISTORY APIS ===================
export async function apiGetActions(params = {}) {
  const query = new URLSearchParams()
  if (params.device) query.append('device', params.device)
  if (params.action) query.append('action', params.action)
  if (params.status) query.append('status', params.status)
  if (params.time) query.append('time', params.time)
  if (params.page) query.append('page', params.page)
  if (params.size) query.append('size', params.size)

  const queryString = query.toString() ? `?${query.toString()}` : ''
  return request(`/actions${queryString}`)
}
