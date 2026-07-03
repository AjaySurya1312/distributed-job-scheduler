import { useEffect, useRef, useCallback, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '@/store/auth.store'
import type { WsEvent, WsEventType } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseWebSocketReturn {
  isConnected: boolean
  lastEvent: WsEvent | null
  subscribe: (event: WsEventType | string, handler: (data: WsEvent) => void) => void
  unsubscribe: (event: WsEventType | string, handler: (data: WsEvent) => void) => void
  emit: (event: string, data?: unknown) => void
}

type EventHandlers = Map<string, Set<(data: WsEvent) => void>>

// ─── Singleton socket (shared across hook instances) ─────────────────────────

let globalSocket: Socket | null = null
let socketRefCount = 0

function getSocket(): Socket {
  if (!globalSocket || !globalSocket.connected) {
    const WS_URL = import.meta.env.VITE_WS_URL || window.location.origin

    globalSocket = io(WS_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    })
  }
  return globalSocket
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<WsEvent | null>(null)
  const handlersRef = useRef<EventHandlers>(new Map())
  const socketRef = useRef<Socket | null>(null)
  const { organization } = useAuthStore()

  useEffect(() => {
    socketRefCount++
    const socket = getSocket()
    socketRef.current = socket

    // ── Connection handlers ──
    const handleConnect = () => {
      setIsConnected(true)
      // Subscribe to organization room on connect
      if (organization?.id) {
        socket.emit('subscribe', { organizationId: organization.id })
      }
    }

    const handleDisconnect = () => {
      setIsConnected(false)
    }

    const handleError = (error: Error) => {
      console.warn('[WebSocket] Connection error:', error.message)
      setIsConnected(false)
    }

    const handleReconnect = () => {
      setIsConnected(true)
      if (organization?.id) {
        socket.emit('subscribe', { organizationId: organization.id })
      }
    }

    // ── Generic event router ──
    const handleJobEvent = (data: WsEvent) => {
      setLastEvent(data)
      const handlers = handlersRef.current.get(data.type)
      handlers?.forEach((handler) => handler(data))

      // Also call wildcard handlers
      const wildcardHandlers = handlersRef.current.get('*')
      wildcardHandlers?.forEach((handler) => handler(data))
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleError)
    socket.on('reconnect', handleReconnect)

    // Listen to all job and worker events
    const JOB_EVENTS: WsEventType[] = [
      'JOB_CREATED', 'JOB_QUEUED', 'JOB_STARTED', 'JOB_COMPLETED',
      'JOB_FAILED', 'JOB_RETRYING', 'JOB_DEAD', 'JOB_CANCELLED',
    ]
    const WORKER_EVENTS: WsEventType[] = [
      'WORKER_CONNECTED', 'WORKER_DISCONNECTED', 'WORKER_HEARTBEAT',
    ]
    const QUEUE_EVENTS: WsEventType[] = ['QUEUE_PAUSED', 'QUEUE_RESUMED']
    const STAT_EVENTS: WsEventType[] = ['STATS_UPDATE']

    const ALL_EVENTS = [...JOB_EVENTS, ...WORKER_EVENTS, ...QUEUE_EVENTS, ...STAT_EVENTS]

    ALL_EVENTS.forEach((event) => {
      socket.on(event, handleJobEvent)
    })

    // Also listen to generic 'event' channel that wraps all events
    socket.on('event', handleJobEvent)

    if (socket.connected) {
      setIsConnected(true)
      if (organization?.id) {
        socket.emit('subscribe', { organizationId: organization.id })
      }
    }

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleError)
      socket.off('reconnect', handleReconnect)
      ALL_EVENTS.forEach((event) => socket.off(event, handleJobEvent))
      socket.off('event', handleJobEvent)

      socketRefCount--
      if (socketRefCount <= 0) {
        socketRefCount = 0
        // Don't disconnect - keep alive for reconnects
      }
    }
  }, [organization?.id])

  // ── Subscribe to specific event ──
  const subscribe = useCallback((event: WsEventType | string, handler: (data: WsEvent) => void) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set())
    }
    handlersRef.current.get(event)!.add(handler)
  }, [])

  // ── Unsubscribe from specific event ──
  const unsubscribe = useCallback((event: WsEventType | string, handler: (data: WsEvent) => void) => {
    handlersRef.current.get(event)?.delete(handler)
  }, [])

  // ── Emit event ──
  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data)
  }, [])

  return { isConnected, lastEvent, subscribe, unsubscribe, emit }
}
