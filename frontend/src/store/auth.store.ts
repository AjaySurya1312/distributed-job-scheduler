import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/api/auth.api'
import type { User, Organization, LoginCredentials, RegisterData, AuthTokens } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null
  organization: Organization | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  tokenExpiresAt: number | null
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  setUser: (user: User) => void
  setOrganization: (org: Organization) => void
  setTokens: (tokens: AuthTokens) => void
  clearAuth: () => void
}

type AuthStore = AuthState & AuthActions

// ─── Store ────────────────────────────────────────────────────────────────────

let refreshTimer: ReturnType<typeof setTimeout> | null = null

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // ── Initial State ──
      user: null,
      organization: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      tokenExpiresAt: null,

      // ── Actions ──
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true })
        try {
          const response = await authApi.login(credentials)
          const { user, organization, tokens } = response
          const expiresAt = Date.now() + tokens.expiresIn * 1000

          set({
            user,
            organization,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            tokenExpiresAt: expiresAt,
          })

          // Schedule token refresh 1 minute before expiry
          scheduleRefresh(tokens.expiresIn, get().refreshToken as string, set, get)
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true })
        try {
          const response = await authApi.register(data)
          const { user, organization, tokens } = response
          const expiresAt = Date.now() + tokens.expiresIn * 1000

          set({
            user,
            organization,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            tokenExpiresAt: expiresAt,
          })

          scheduleRefresh(tokens.expiresIn, tokens.refreshToken, set, get)
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          await authApi.logout()
        } catch {
          // Ignore logout API errors, still clear local state
        } finally {
          if (refreshTimer) {
            clearTimeout(refreshTimer)
            refreshTimer = null
          }
          set({
            user: null,
            organization: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            tokenExpiresAt: null,
          })
        }
      },

      refreshToken: async () => {
        const { refreshToken: token } = get()
        if (!token) return

        try {
          const tokens = await authApi.refreshToken(token)
          const expiresAt = Date.now() + tokens.expiresIn * 1000

          set({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokenExpiresAt: expiresAt,
          })

          scheduleRefresh(tokens.expiresIn, tokens.refreshToken, set, get)
        } catch {
          get().clearAuth()
        }
      },

      setUser: (user: User) => set({ user }),
      setOrganization: (organization: Organization) => set({ organization }),

      setTokens: (tokens: AuthTokens) => {
        const expiresAt = Date.now() + tokens.expiresIn * 1000
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: expiresAt,
        })
      },

      clearAuth: () => {
        if (refreshTimer) {
          clearTimeout(refreshTimer)
          refreshTimer = null
        }
        set({
          user: null,
          organization: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          tokenExpiresAt: null,
        })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        organization: state.organization,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        tokenExpiresAt: state.tokenExpiresAt,
      }),
    }
  )
)

// ─── Auto-refresh helper ──────────────────────────────────────────────────────

function scheduleRefresh(
  expiresIn: number,
  _refreshToken: string,
  set: (partial: Partial<AuthState>) => void,
  get: () => AuthStore
) {
  if (refreshTimer) clearTimeout(refreshTimer)

  // Refresh 60 seconds before expiry
  const refreshIn = Math.max((expiresIn - 60) * 1000, 0)

  refreshTimer = setTimeout(async () => {
    await get().refreshToken()
  }, refreshIn)
}

// ─── Initialize auto-refresh on app start ────────────────────────────────────

export function initAuthRefresh() {
  const state = useAuthStore.getState()
  if (state.isAuthenticated && state.tokenExpiresAt) {
    const remainingMs = state.tokenExpiresAt - Date.now()
    const remainingSec = remainingMs / 1000

    if (remainingSec <= 0) {
      // Token already expired, try refresh immediately
      state.refreshToken()
    } else if (remainingSec < 60) {
      // Less than 1 minute left, refresh now
      state.refreshToken()
    } else {
      // Schedule for 1 minute before expiry
      scheduleRefresh(remainingSec, state.refreshToken as string, useAuthStore.setState, useAuthStore.getState)
    }
  }
}
