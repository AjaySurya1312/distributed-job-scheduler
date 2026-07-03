import { get, post, put, patch, del } from './client'
import type { Queue, CreateQueueDto, PaginatedResponse } from '@/types'

// ─── Queues API ──────────────────────────────────────────────────────────────

export const queuesApi = {
  listQueues: (projectId?: string): Promise<Queue[]> => {
    const url = projectId ? `/queues?projectId=${projectId}` : '/queues'
    return get<Queue[]>(url)
  },

  listQueuesPaginated: (params?: {
    projectId?: string
    page?: number
    pageSize?: number
    search?: string
  }): Promise<PaginatedResponse<Queue>> => {
    const query = new URLSearchParams()
    if (params?.projectId) query.set('projectId', params.projectId)
    if (params?.page) query.set('page', String(params.page))
    if (params?.pageSize) query.set('pageSize', String(params.pageSize))
    if (params?.search) query.set('search', params.search)
    return get<PaginatedResponse<Queue>>(`/queues?${query.toString()}`)
  },

  getQueue: (id: string): Promise<Queue> =>
    get<Queue>(`/queues/${id}`),

  getQueueBySlug: (slug: string): Promise<Queue> =>
    get<Queue>(`/queues/slug/${slug}`),

  createQueue: (data: CreateQueueDto): Promise<Queue> =>
    post<Queue>('/queues', data),

  updateQueue: (id: string, data: Partial<CreateQueueDto>): Promise<Queue> =>
    put<Queue>(`/queues/${id}`, data),

  patchQueue: (id: string, data: Partial<Queue>): Promise<Queue> =>
    patch<Queue>(`/queues/${id}`, data),

  deleteQueue: (id: string): Promise<void> =>
    del<void>(`/queues/${id}`),

  pauseQueue: (id: string): Promise<Queue> =>
    post<Queue>(`/queues/${id}/pause`),

  resumeQueue: (id: string): Promise<Queue> =>
    post<Queue>(`/queues/${id}/resume`),

  drainQueue: (id: string): Promise<{ drained: number }> =>
    post<{ drained: number }>(`/queues/${id}/drain`),

  clearQueue: (id: string): Promise<{ cleared: number }> =>
    del<{ cleared: number }>(`/queues/${id}/jobs`),

  getQueueMetrics: (id: string, period?: string): Promise<{
    throughput: number
    errorRate: number
    avgDurationMs: number
    p95DurationMs: number
  }> =>
    get(`/queues/${id}/metrics${period ? `?period=${period}` : ''}`),
}

export default queuesApi
