import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { ApiError } from '@/types'

// ─── Base URL ────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

// ─── Token management helpers ────────────────────────────────────────────────

function getAccessToken(): string | null {
  try {
    const stored = localStorage.getItem('auth-storage')
    if (!stored) return null
    const parsed = JSON.parse(stored)
    return parsed?.state?.accessToken ?? null
  } catch {
    return null
  }
}

function clearAuthStorage(): void {
  localStorage.removeItem('auth-storage')
}

// ─── Primary Axios Instance ──────────────────────────────────────────────────

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// ─── Request Interceptor: Attach Bearer Token ────────────────────────────────

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor: Handle 401 & Normalize Errors ────────────────────

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // ── 401 handling with token refresh ──
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue requests until token is refreshed
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            resolve(apiClient(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const stored = localStorage.getItem('auth-storage')
        const parsed = stored ? JSON.parse(stored) : null
        const refreshToken = parsed?.state?.refreshToken

        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
        const newAccessToken: string = response.data.accessToken

        // Update stored token
        if (parsed?.state) {
          parsed.state.accessToken = newAccessToken
          localStorage.setItem('auth-storage', JSON.stringify(parsed))
        }

        onRefreshed(newAccessToken)
        isRefreshing = false

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        }
        return apiClient(originalRequest)
      } catch (_refreshError) {
        isRefreshing = false
        refreshSubscribers = []
        clearAuthStorage()
        window.location.href = '/login'
        return Promise.reject(_refreshError)
      }
    }

    // ── Normalize errors ──
    const normalizedError: ApiError = {
      code: error.response?.data?.code ?? 'UNKNOWN_ERROR',
      message: error.response?.data?.message ?? error.message ?? 'An unexpected error occurred',
      details: error.response?.data?.details,
      statusCode: error.response?.status,
    }

    return Promise.reject(normalizedError)
  }
)

// ─── Typed HTTP Helpers ──────────────────────────────────────────────────────

export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<T>(url, config)
  return response.data
}

export async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.post<T>(url, data, config)
  return response.data
}

export async function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.put<T>(url, data, config)
  return response.data
}

export async function patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.patch<T>(url, data, config)
  return response.data
}

export async function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.delete<T>(url, config)
  return response.data
}

// ─── Authenticated client factory ────────────────────────────────────────────

export function createAuthenticatedClient(token: string): AxiosInstance {
  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  return client
}

export default apiClient
