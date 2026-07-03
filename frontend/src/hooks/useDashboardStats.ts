import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { dashboardApi } from '@/api/dashboard.api'
import { useWebSocket } from './useWebSocket'
import type { DashboardStats } from '@/types'

// ─── Query Key ────────────────────────────────────────────────────────────────

export const DASHBOARD_STATS_KEY = ['dashboard', 'stats'] as const

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDashboardStats() {
  const queryClient = useQueryClient()
  const { lastEvent, isConnected } = useWebSocket()

  // ── Fetch stats every 30 seconds ──
  const query = useQuery({
    queryKey: DASHBOARD_STATS_KEY,
    queryFn: () => dashboardApi.getStats(),
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 2,
  })

  // ── Invalidate on real-time events ──
  useEffect(() => {
    if (!lastEvent) return

    const invalidatingEvents = [
      'JOB_COMPLETED',
      'JOB_FAILED',
      'JOB_STARTED',
      'JOB_DEAD',
      'JOB_CANCELLED',
      'WORKER_CONNECTED',
      'WORKER_DISCONNECTED',
      'STATS_UPDATE',
    ]

    if (invalidatingEvents.includes(lastEvent.type)) {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY })
    }
  }, [lastEvent, queryClient])

  return {
    stats: query.data as DashboardStats | undefined,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isConnected,
    refetch: query.refetch,
  }
}

// ─── Throughput hook ──────────────────────────────────────────────────────────

export function useThroughput(period: '1h' | '6h' | '24h' | '7d' | '30d' = '24h') {
  return useQuery({
    queryKey: ['dashboard', 'throughput', period],
    queryFn: () => dashboardApi.getThroughput(period),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

// ─── Workers hook ─────────────────────────────────────────────────────────────

export function useWorkers() {
  const queryClient = useQueryClient()
  const { lastEvent } = useWebSocket()

  const query = useQuery({
    queryKey: ['workers'],
    queryFn: () => dashboardApi.getWorkers(),
    refetchInterval: 15_000,
    staleTime: 10_000,
  })

  useEffect(() => {
    if (!lastEvent) return

    const workerEvents = ['WORKER_CONNECTED', 'WORKER_DISCONNECTED', 'WORKER_HEARTBEAT']
    if (workerEvents.includes(lastEvent.type)) {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
    }
  }, [lastEvent, queryClient])

  return query
}

// ─── Activity feed hook ───────────────────────────────────────────────────────

export function useRecentActivity(limit = 20) {
  return useQuery({
    queryKey: ['dashboard', 'activity', limit],
    queryFn: () => dashboardApi.getRecentActivity(limit),
    refetchInterval: 10_000,
    staleTime: 5_000,
  })
}

// ─── System health hook ───────────────────────────────────────────────────────

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system', 'health'],
    queryFn: () => dashboardApi.getSystemHealth(),
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}
