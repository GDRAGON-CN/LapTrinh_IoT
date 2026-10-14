import { io } from 'socket.io-client'

let socket = null

export function getSocket() {
  if (!socket) {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socket.on('connect', () => {
      console.log('[Socket.IO] Connected to backend service')
    })

    socket.on('disconnect', () => {
      console.warn('[Socket.IO] Disconnected from backend')
    })

    socket.on('connect_error', (err) => {
      console.warn('[Socket.IO] Connection warning:', err.message)
    })
  }
  return socket
}
