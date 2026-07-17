import { create } from 'zustand'

import { getStorageItem, setStorageItem, removeStorageItem } from '@/utils/formatters'
import type { AuthTokens, User } from '../types'

interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  setUser: (user: User) => void
  setTokens: (tokens: AuthTokens) => void
  setAuth: (user: User, tokens: AuthTokens) => void
  clearAuth: () => void
  initFromStorage: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,

  setUser: (user) => {
    setStorageItem('auth_user', user)
    set({ user, isAuthenticated: true })
  },

  setTokens: (tokens) => {
    setStorageItem('auth_tokens', tokens)
    set({ tokens })
  },

  setAuth: (user, tokens) => {
    setStorageItem('auth_user', user)
    setStorageItem('auth_tokens', tokens)
    set({ user, tokens, isAuthenticated: true })
  },

  clearAuth: () => {
    removeStorageItem('auth_user')
    removeStorageItem('auth_tokens')
    set({ user: null, tokens: null, isAuthenticated: false })
  },

  initFromStorage: () => {
    const user = getStorageItem<User>('auth_user')
    const tokens = getStorageItem<AuthTokens>('auth_tokens')
    if (user && tokens) {
      set({ user, tokens, isAuthenticated: true })
    }
  },
}))
