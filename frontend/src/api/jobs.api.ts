import { get, post, patch, del } from './client'
import type {
  Job,
  JobFilters,
  Execution,
  LogEntry,
  PaginatedResponse,
  DashboardStats,
  JobCounts,
} from '@/types'

// ─── Jobs API ────────────────────────────────────────────────────────────────

export const jobsApi = {
  listJobs: (filters: JobFilters = {}): Promise<PaginatedResponse<Job>> => {
    const params = new URLSearchParams()
    if (filters.status?.length) params.set('status', filters.status.join(','))
    if (filters.type) params.set('type', filters.type)
    if (filters.priority) params.set('priority', filters.priority)
    if (filters.queueId) params.set('queueId', filters.queueId)
    if (filters.search) params.set('search', filters.search)
    if (filters.fromDate) params.set('fromDate', filters.fromDate)
    if (filters.toDate) params.set('toDate', filters.toDate)
    if (filters.page) params.set('page', String(filters.page))
    if (filters.pageSize) params.set('pageSize', String(filters.pageSize))
    if (filters.sortBy) params.set('sortBy', filters.sortBy)
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)
    return get<PaginatedResponse<Job>>(`/jobs?${params.toString()}`)
  },

  createJob: (data: {
    queueId: string
    name: string
    type: Job['type']
    payload?: Record<string, unknown>
    priority?: Job['priority']
    maxAttempts?: number
    runAt?: string
    cronExpression?: string
    tags?: string[]
  }): Promise<Job> =>
    post<Job>('/jobs', data),

  getJob: (id: string): Promise<Job> =>
    get<Job>(`/jobs/${id}`),

  cancelJob: (id: string): Promise<Job> =>
    patch<Job>(`/jobs/${id}/cancel`),

  retryJob: (id: string): Promise<Job> =>
    post<Job>(`/jobs/${id}/retry`),

  getJobExecutions: (jobId: string): Promise<Execution[]> =>
    get<Execution[]>(`/jobs/${jobId}/executions`),

  getJobLogs: (jobId: string, executionId?: string): Promise<LogEntry[]> => {
    const url = executionId
      ? `/jobs/${jobId}/executions/${executionId}/logs`
      : `/jobs/${jobId}/logs`
    return get<LogEntry[]>(url)
  },

  getJobStats: (queueId: string): Promise<JobCounts> =>
    get<JobCounts>(`/queues/${queueId}/stats`),

  bulkCancel: (jobIds: string[]): Promise<{ cancelled: number }> =>
    post<{ cancelled: number }>('/jobs/bulk/cancel', { jobIds }),

  bulkRetry: (jobIds: string[]): Promise<{ retried: number }> =>
    post<{ retried: number }>('/jobs/bulk/retry', { jobIds }),

  // Dead Letter Queue
  listDLQ: (queueId: string): Promise<PaginatedResponse<Job>> =>
    get<PaginatedResponse<Job>>(`/queues/${queueId}/dlq`),

  retryDLQ: (queueId: string, jobId: string): Promise<Job> =>
    post<Job>(`/queues/${queueId}/dlq/${jobId}/retry`),

  purgeAllDLQ: (queueId: string): Promise<{ purged: number }> =>
    del<{ purged: number }>(`/queues/${queueId}/dlq`),

  // Stats & analytics
  getDashboardStats: (period?: string): Promise<DashboardStats> =>
    get<DashboardStats>(`/jobs/stats/dashboard${period ? `?period=${period}` : ''}`),
}

export default jobsApi
