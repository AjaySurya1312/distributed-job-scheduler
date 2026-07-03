// ─── Core Entities ─────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl?: string
  role: 'ADMIN' | 'MEMBER' | 'VIEWER'
  createdAt: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  plan: 'FREE' | 'PRO' | 'ENTERPRISE'
  logoUrl?: string
  createdAt: string
  memberCount?: number
}

export interface Project {
  id: string
  organizationId: string
  name: string
  slug: string
  description?: string
  color: string
  createdAt: string
  updatedAt: string
  queueCount?: number
}

// ─── Job Types ──────────────────────────────────────────────────────────────

export type JobStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYING'
  | 'DEAD'
  | 'CANCELLED'

export type JobType = 'IMMEDIATE' | 'DELAYED' | 'SCHEDULED' | 'BATCH'

export type JobPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW'

export interface JobPayload {
  [key: string]: unknown
}

export interface Job {
  id: string
  queueId: string
  queueName?: string
  name: string
  type: JobType
  status: JobStatus
  payload: JobPayload
  priority: JobPriority
  priorityScore: number
  attempts: number
  maxAttempts: number
  createdAt: string
  updatedAt: string
  runAt?: string
  scheduledFor?: string
  cronExpression?: string
  lastRunAt?: string
  nextRunAt?: string
  worker?: Pick<Worker, 'id' | 'hostname'>
  tags?: string[]
  durationMs?: number
  errorMessage?: string
}

export interface JobCounts {
  pending: number
  queued: number
  running: number
  completed: number
  failed: number
  retrying: number
  dead: number
  cancelled: number
  total: number
}

export interface JobFilters {
  status?: JobStatus[]
  type?: JobType
  priority?: JobPriority
  queueId?: string
  search?: string
  fromDate?: string
  toDate?: string
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// ─── Queue Types ────────────────────────────────────────────────────────────

export interface Queue {
  id: string
  projectId: string
  projectName?: string
  name: string
  slug: string
  description?: string
  concurrency: number
  jobTimeoutMs: number
  retryDelayMs: number
  maxRetries: number
  isPaused: boolean
  priority: number
  jobCounts?: JobCounts
  createdAt: string
  updatedAt: string
}

export interface CreateQueueDto {
  projectId: string
  name: string
  description?: string
  concurrency?: number
  jobTimeoutMs?: number
  retryDelayMs?: number
  maxRetries?: number
  priority?: number
}

// ─── Worker Types ───────────────────────────────────────────────────────────

export type WorkerStatus = 'ACTIVE' | 'IDLE' | 'DRAINING' | 'DEAD' | 'STOPPED'

export interface Worker {
  id: string
  hostname: string
  pid: number
  version?: string
  status: WorkerStatus
  activeJobCount: number
  maxConcurrency: number
  totalJobsProcessed: number
  totalJobsFailed: number
  lastHeartbeatAt: string
  startedAt: string
  queueId?: string
  queueName?: string
  memoryUsageMb?: number
  cpuPercent?: number
  tags?: string[]
}

export interface WorkerHeartbeat {
  workerId: string
  timestamp: string
  activeJobCount: number
  memoryUsageMb: number
  cpuPercent: number
}

// ─── Execution Types ────────────────────────────────────────────────────────

export type ExecutionStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT' | 'CANCELLED'

export interface Execution {
  id: string
  jobId: string
  workerId: string
  workerHostname?: string
  attemptNumber: number
  status: ExecutionStatus
  startedAt: string
  finishedAt?: string
  durationMs?: number
  errorMessage?: string
  errorStack?: string
  metadata?: Record<string, unknown>
}

export interface LogEntry {
  id: string
  executionId: string
  jobId: string
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
  message: string
  timestamp: string
  metadata?: Record<string, unknown>
}

// ─── Dashboard & Analytics ──────────────────────────────────────────────────

export interface DashboardStats {
  totalJobs: number
  completedJobs: number
  failedJobs: number
  runningJobs: number
  queuedJobs: number
  pendingJobs: number
  deadJobs: number
  cancelledJobs: number
  workersOnline: number
  workersIdle: number
  avgExecutionMs: number
  p95ExecutionMs: number
  p99ExecutionMs: number
  throughputPerHour: number
  successRate: number
  errorRate: number
  period: string
}

export interface ThroughputDataPoint {
  timestamp: string
  completed: number
  failed: number
  total: number
  hour: string
}

export interface QueueThroughput {
  queueId: string
  queueName: string
  completed: number
  failed: number
  running: number
  avgDurationMs: number
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down'
  api: 'up' | 'down'
  database: 'up' | 'down'
  redis: 'up' | 'down'
  workers: 'up' | 'down'
  uptime: number
  version: string
}

// ─── WebSocket Events ───────────────────────────────────────────────────────

export type WsEventType =
  | 'JOB_CREATED'
  | 'JOB_QUEUED'
  | 'JOB_STARTED'
  | 'JOB_COMPLETED'
  | 'JOB_FAILED'
  | 'JOB_RETRYING'
  | 'JOB_DEAD'
  | 'JOB_CANCELLED'
  | 'WORKER_CONNECTED'
  | 'WORKER_DISCONNECTED'
  | 'WORKER_HEARTBEAT'
  | 'QUEUE_PAUSED'
  | 'QUEUE_RESUMED'
  | 'STATS_UPDATE'

export interface WsEvent<T = unknown> {
  type: WsEventType
  payload: T
  timestamp: string
  organizationId: string
}

export interface JobEvent extends WsEvent {
  payload: {
    job: Partial<Job>
    previousStatus?: JobStatus
    workerId?: string
  }
}

export interface WorkerEvent extends WsEvent {
  payload: {
    worker: Partial<Worker>
  }
}

// ─── Auth Types ─────────────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  organizationName: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface AuthResponse {
  user: User
  organization: Organization
  tokens: AuthTokens
}

export interface ApiKey {
  id: string
  name: string
  prefix: string
  createdAt: string
  lastUsedAt?: string
  expiresAt?: string
}

// ─── Pagination & API ───────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface ApiError {
  code: string
  message: string
  details?: unknown
  statusCode?: number
}

// ─── Notification ───────────────────────────────────────────────────────────

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  timestamp: string
  read: boolean
  jobId?: string
}

// ─── UI Helpers ─────────────────────────────────────────────────────────────

export type ThemeMode = 'dark' | 'light'

export interface SelectOption {
  value: string
  label: string
  icon?: string
  color?: string
}

export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

export interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}
