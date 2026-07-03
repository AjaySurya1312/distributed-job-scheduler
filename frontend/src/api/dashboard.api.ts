import { get } from './client'
import type {
  DashboardStats,
  ThroughputDataPoint,
  Worker,
  SystemHealth,
  QueueThroughput,
} from '@/types'

// ─── Dashboard API ───────────────────────────────────────────────────────────

export const dashboardApi = {
  getStats: (period?: string): Promise<DashboardStats> =>
    get<DashboardStats>(`/dashboard/stats${period ? `?period=${period}` : ''}`),

  getThroughput: (period: '1h' | '6h' | '24h' | '7d' | '30d' = '24h'): Promise<ThroughputDataPoint[]> =>
    get<ThroughputDataPoint[]>(`/dashboard/throughput?period=${period}`),

  getWorkers: (): Promise<Worker[]> =>
    get<Worker[]>('/workers'),

  getWorker: (id: string): Promise<Worker> =>
    get<Worker>(`/workers/${id}`),

  getWorkerHeartbeats: (workerId: string, limit?: number): Promise<Array<{
    timestamp: string
    cpuPercent: number
    memoryUsageMb: number
    activeJobCount: number
  }>> =>
    get(`/workers/${workerId}/heartbeats${limit ? `?limit=${limit}` : ''}`),

  getSystemHealth: (): Promise<SystemHealth> =>
    get<SystemHealth>('/health'),

  getQueueThroughput: (period?: string): Promise<QueueThroughput[]> =>
    get<QueueThroughput[]>(`/dashboard/queue-throughput${period ? `?period=${period}` : ''}`),

  getExecutionDistribution: (period?: string): Promise<Array<{
    bucket: string
    count: number
    minMs: number
    maxMs: number
  }>> =>
    get(`/dashboard/execution-distribution${period ? `?period=${period}` : ''}`),

  getJobStatusDistribution: (): Promise<Array<{
    status: string
    count: number
    percentage: number
  }>> =>
    get('/dashboard/status-distribution'),

  getRecentActivity: (limit?: number): Promise<Array<{
    id: string
    type: string
    jobId: string
    jobName: string
    status: string
    workerId?: string
    workerHostname?: string
    timestamp: string
    durationMs?: number
  }>> =>
    get(`/dashboard/activity${limit ? `?limit=${limit}` : ''}`),
}

export default dashboardApi
