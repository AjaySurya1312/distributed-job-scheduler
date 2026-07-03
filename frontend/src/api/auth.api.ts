import { get, post, del } from './client'
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
  ApiKey,
  AuthTokens,
} from '@/types'

// ─── Auth API ────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: RegisterData): Promise<AuthResponse> =>
    post<AuthResponse>('/auth/register', data),

  login: (credentials: LoginCredentials): Promise<AuthResponse> =>
    post<AuthResponse>('/auth/login', credentials),

  logout: (): Promise<void> =>
    post<void>('/auth/logout'),

  refreshToken: (refreshToken: string): Promise<AuthTokens> =>
    post<AuthTokens>('/auth/refresh', { refreshToken }),

  getMe: (): Promise<User> =>
    get<User>('/auth/me'),

  updateProfile: (data: Partial<Pick<User, 'firstName' | 'lastName' | 'avatarUrl'>>): Promise<User> =>
    post<User>('/auth/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }): Promise<void> =>
    post<void>('/auth/change-password', data),

  createApiKey: (name: string, expiresInDays?: number): Promise<{ apiKey: ApiKey; secret: string }> =>
    post<{ apiKey: ApiKey; secret: string }>('/auth/api-keys', { name, expiresInDays }),

  listApiKeys: (): Promise<ApiKey[]> =>
    get<ApiKey[]>('/auth/api-keys'),

  revokeApiKey: (id: string): Promise<void> =>
    del<void>(`/auth/api-keys/${id}`),
}

export default authApi
