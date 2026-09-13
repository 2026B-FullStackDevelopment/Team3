import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { useAuth } from '@/context/auth/useAuth.js'
import { NotificationContext } from '@/features/notification/Context/context.js'
import { NotificationToast } from '@/features/notification/Component/NotificationToast.jsx'
import { useNotificationSound } from '@/features/notification/Hook/useNotificationSound.js'
import {
  NOTIFICATION_TYPES,
  normalizeNotification,
} from '@/features/notification/Model/notificationModel.js'
import { notificationService } from '@/features/notification/Service/notificationService.js'
import { createNotificationSocket } from '@/features/notification/Service/notificationSocket.js'

const INITIAL_STATE = {
  entries: [],
  total: 0,
  page: 0,
  limit: 20,
  unreadCount: 0,
  status: 'idle',
  socketStatus: 'disconnected',
  error: null,
  toast: null,
}

function mergeEntries(first, second) {
  return [...new Map([...first, ...second].map((entry) => [entry.id, entry])).values()].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  )
}

function reducer(state, action) {
  switch (action.type) {
    case 'reset':
      return INITIAL_STATE
    case 'load-start':
      return { ...state, status: state.entries.length ? 'ready' : 'loading', error: null }
    case 'load-success': {
      const entries = mergeEntries(action.entries, state.entries)
      return {
        ...state,
        entries,
        total: Math.max(action.total, entries.length),
        page: Math.max(state.page, action.page),
        limit: action.limit,
        status: 'ready',
        error: null,
      }
    }
    case 'load-error':
      return { ...state, status: state.entries.length ? 'ready' : 'error', error: action.message }
    case 'count-success':
      return { ...state, unreadCount: Math.max(0, action.count) }
    case 'socket-status':
      return { ...state, socketStatus: action.status }
    case 'receive':
      return {
        ...state,
        entries: mergeEntries([action.notification], state.entries),
        total: state.total + 1,
        unreadCount: state.unreadCount + (action.notification.isRead ? 0 : 1),
        toast: action.notification,
      }
    case 'dismiss-toast':
      return { ...state, toast: null }
    case 'mark-one':
      return {
        ...state,
        entries: state.entries.map((entry) =>
          entry.id === action.id ? { ...entry, isRead: true } : entry,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }
    case 'restore-one':
      return {
        ...state,
        entries: state.entries.map((entry) =>
          entry.id === action.id ? { ...entry, isRead: false } : entry,
        ),
        unreadCount: state.unreadCount + 1,
        error: action.message,
      }
    case 'mark-all':
      return {
        ...state,
        entries: state.entries.map((entry) =>
          action.ids.has(entry.id) ? { ...entry, isRead: true } : entry,
        ),
        unreadCount: 0,
      }
    case 'restore-many':
      return {
        ...state,
        entries: state.entries.map((entry) =>
          action.ids.has(entry.id) ? { ...entry, isRead: false } : entry,
        ),
        unreadCount: state.unreadCount + action.previousUnreadCount,
        error: action.message,
      }
    default:
      return state
  }
}

function errorMessage(result, fallback) {
  return result?.error?.message ?? result?.data?.message ?? fallback
}

export function NotificationProvider({ children }) {
  const { status: authStatus, role } = useAuth()
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const seenIds = useRef(new Set())
  const {
    enabled: soundEnabled,
    blocked: soundBlocked,
    enable: enableSound,
    play: playSound,
    stop: stopSound,
    toggle: toggleSound,
  } = useNotificationSound()
  const playSoundRef = useRef(playSound)

  useEffect(() => {
    playSoundRef.current = playSound
  }, [playSound])
  const enabledForRole =
    authStatus === 'authenticated' && (role === 'Donor' || role === 'Recipient')

  const loadPage = useCallback(async (page = 1) => {
    dispatch({ type: 'load-start' })
    const result = await notificationService.list({ page, limit: 20 })
    if (!result.ok) {
      dispatch({
        type: 'load-error',
        message: errorMessage(result, 'Notifications could not be loaded.'),
      })
      return false
    }

    const entries = (result.data?.entries ?? []).map(normalizeNotification).filter(Boolean)
    entries.forEach((entry) => seenIds.current.add(entry.id))
    dispatch({
      type: 'load-success',
      entries,
      total: Number(result.data?.total) || entries.length,
      page: Number(result.data?.page) || page,
      limit: Number(result.data?.limit) || 20,
    })
    return true
  }, [])

  const refreshCount = useCallback(async () => {
    const result = await notificationService.unreadCount()
    if (result.ok) {
      dispatch({ type: 'count-success', count: Number(result.data?.count) || 0 })
    }
  }, [])

  const refresh = useCallback(async () => {
    await Promise.all([loadPage(1), refreshCount()])
  }, [loadPage, refreshCount])

  useEffect(() => {
    if (!enabledForRole) {
      seenIds.current.clear()
      stopSound()
      dispatch({ type: 'reset' })
      return undefined
    }

    let active = true
    const socket = createNotificationSocket()

    const handleConnect = () => {
      if (!active) return
      dispatch({ type: 'socket-status', status: 'connected' })
      refresh()
    }
    const handleDisconnect = () => {
      if (active) dispatch({ type: 'socket-status', status: 'disconnected' })
    }
    const handleConnectError = () => {
      if (active) dispatch({ type: 'socket-status', status: 'error' })
    }
    const handleNotification = (payload) => {
      const notification = normalizeNotification(payload)
      if (!active || !notification || seenIds.current.has(notification.id)) return
      seenIds.current.add(notification.id)
      dispatch({ type: 'receive', notification })
      if (notification.type === NOTIFICATION_TYPES.LISTING_SOLD_OUT) {
        playSoundRef.current(notification.id)
      }
    }

    dispatch({ type: 'socket-status', status: 'connecting' })
    loadPage(1)
    refreshCount()
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)
    socket.on('notification:created', handleNotification)
    socket.connect()

    return () => {
      active = false
      socket.removeAllListeners()
      socket.disconnect()
    }
  }, [enabledForRole, loadPage, refresh, refreshCount, stopSound])

  const markRead = useCallback(
    async (id) => {
      const entry = state.entries.find((item) => item.id === id)
      if (!entry || entry.isRead) return true
      dispatch({ type: 'mark-one', id })
      const result = await notificationService.markRead(id)
      if (result.ok) return true
      dispatch({
        type: 'restore-one',
        id,
        message: errorMessage(result, 'The notification could not be marked as read.'),
      })
      return false
    },
    [state.entries],
  )

  const markAllRead = useCallback(async () => {
    const ids = new Set(state.entries.filter((entry) => !entry.isRead).map((entry) => entry.id))
    const previousUnreadCount = state.unreadCount
    if (previousUnreadCount === 0) return true
    dispatch({ type: 'mark-all', ids })
    const result = await notificationService.markAllRead()
    if (result.ok) return true
    dispatch({
      type: 'restore-many',
      ids,
      previousUnreadCount,
      message: errorMessage(result, 'Notifications could not be marked as read.'),
    })
    return false
  }, [state.entries, state.unreadCount])

  const loadMore = useCallback(() => {
    if (state.entries.length >= state.total || state.status === 'loading') return
    loadPage(state.page + 1)
  }, [loadPage, state.entries.length, state.page, state.status, state.total])

  const value = useMemo(
    () => ({
      ...state,
      hasMore: state.entries.length < state.total,
      markRead,
      markAllRead,
      loadMore,
      refresh,
      soundEnabled,
      soundBlocked,
      enableSound,
      toggleSound,
    }),
    [
      loadMore,
      markAllRead,
      markRead,
      refresh,
      enableSound,
      soundBlocked,
      soundEnabled,
      state,
      toggleSound,
    ],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationToast
        notification={state.toast}
        onDismiss={() => dispatch({ type: 'dismiss-toast' })}
      />
    </NotificationContext.Provider>
  )
}
