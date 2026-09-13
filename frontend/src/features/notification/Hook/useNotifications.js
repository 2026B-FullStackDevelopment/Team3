import { useContext } from 'react'
import { NotificationContext } from '@/features/notification/Context/context.js'

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === null) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}
