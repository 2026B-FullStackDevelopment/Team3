import { io } from 'socket.io-client'
import { env } from '@/config/env.js'

/** Creates one caller-owned Socket.IO connection authenticated by session cookie. */
export function createNotificationSocket() {
  return io(env.SOCKET_URL || undefined, {
    autoConnect: false,
    withCredentials: true,
    transports: ['websocket', 'polling'],
  })
}
