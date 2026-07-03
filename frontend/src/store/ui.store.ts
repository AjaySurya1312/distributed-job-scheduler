import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ThemeMode, Notification } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UIState {
  theme: ThemeMode
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  notifications: Notification[]
  unreadCount: number
  commandPaletteOpen: boolean
  activeOrganizationId: string | null
  activeProjectId: string | null
}

interface UIActions {
  toggleTheme: () => void
  setTheme: (theme: ThemeMode) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  dismissNotification: (id: string) => void
  markAllRead: () => void
  clearNotifications: () => void
  setCommandPaletteOpen: (open: boolean) => void
  setActiveOrganization: (id: string | null) => void
  setActiveProject: (id: string | null) => void
}

type UIStore = UIState & UIActions

// ─── Store ────────────────────────────────────────────────────────────────────

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // ── Initial State ──
      theme: 'dark',
      sidebarOpen: true,
      sidebarCollapsed: false,
      notifications: [],
      unreadCount: 0,
      commandPaletteOpen: false,
      activeOrganizationId: null,
      activeProjectId: null,

      // ── Actions ──
      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark'
        set({ theme: newTheme })
        applyTheme(newTheme)
      },

      setTheme: (theme: ThemeMode) => {
        set({ theme })
        applyTheme(theme)
      },

      setSidebarOpen: (sidebarOpen: boolean) => set({ sidebarOpen }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarCollapsed: (sidebarCollapsed: boolean) => set({ sidebarCollapsed }),

      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          timestamp: new Date().toISOString(),
          read: false,
        }
        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50),
          unreadCount: state.unreadCount + 1,
        }))
      },

      dismissNotification: (id: string) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === id)
          return {
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: notification && !notification.read
              ? Math.max(0, state.unreadCount - 1)
              : state.unreadCount,
          }
        })
      },

      markAllRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }))
      },

      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),

      setCommandPaletteOpen: (commandPaletteOpen: boolean) => set({ commandPaletteOpen }),

      setActiveOrganization: (activeOrganizationId: string | null) => set({ activeOrganizationId }),

      setActiveProject: (activeProjectId: string | null) => set({ activeProjectId }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        activeOrganizationId: state.activeOrganizationId,
        activeProjectId: state.activeProjectId,
      }),
    }
  )
)

// ─── Theme application ────────────────────────────────────────────────────────

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
  } else {
    root.classList.add('light')
    root.classList.remove('dark')
  }
}

// ─── Initialize theme on app start ───────────────────────────────────────────

export function initTheme() {
  const stored = localStorage.getItem('ui-storage')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      const theme = parsed?.state?.theme ?? 'dark'
      applyTheme(theme)
    } catch {
      applyTheme('dark')
    }
  } else {
    applyTheme('dark')
  }
}
