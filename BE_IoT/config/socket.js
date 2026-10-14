import { Server } from 'socket.io'

let io = null

export function initSocket(httpServer) {
  const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'
  io = new Server(httpServer, {
    cors: {
      origin: frontendOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })

  io.on('connection', (socket) => {
    // Client kết nối thành công
    socket.on('disconnect', () => {})
  })

  return io
}

export function getIO() {
  return io
}

export function emitEvent(eventName, data) {
  if (io) {
    io.emit(eventName, data)
  }
}
