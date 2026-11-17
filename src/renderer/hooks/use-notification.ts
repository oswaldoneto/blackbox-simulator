import { useState, useCallback, useRef } from 'react'

type NotificationType = 'info' | 'success' | 'error'

interface NotificationState {
  id: number
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
  const proximoId = useRef(0)

  const showNotification = useCallback((message: string, type: NotificationType) => {
    proximoId.current += 1
    setNotification({ id: proximoId.current, message, type })
  }, [])

  const clearNotification = useCallback(() => {
    setNotification(null)
  }, [])

  return { notification, showNotification, clearNotification }
}
