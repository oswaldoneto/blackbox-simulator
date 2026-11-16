import { useState, useCallback } from 'react'

type NotificationType = 'info' | 'success' | 'error'

interface NotificationState {
  message: string
  type: NotificationType
}

interface UseNotificationReturn {
  notification: NotificationState | null
  showNotification: (message: string, type: NotificationType) => void
  clearNotification: () => void
}

export function useNotification(): UseNotificationReturn {
  const [notification, setNotification] = useState<NotificationState | null>(null)

  const showNotification = useCallback((message: string, type: NotificationType) => {
    setNotification({ message, type })
  }, [])

  const clearNotification = useCallback(() => {
    setNotification(null)
  }, [])

  return { notification, showNotification, clearNotification }
}
