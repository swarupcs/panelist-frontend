// src/store/authStore.ts
//
// FIX: isInitialized flag
// ─────────────────────────────────────────────────────────────────────────────
// On page refresh, Zustand initializes with isAuthenticated: false.
// ProtectedRoute renders before AuthInitializer's useEffect fires, sees
// isAuthenticated=false, and redirects to /login — which then redirects to
// /dashboard after restoring tokens. The page always ends up at /dashboard
// regardless of where the user refreshed.
//
// Fix: add isInitialized (default false). initFromStorage() sets it to true
// synchronously. ProtectedRoute waits (shows LoadingScreen) until
// isInitialized is true before making any auth decision.

import { create } from 'zustand';
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from '@/utils/formatters';
import type { AuthTokens, User } from '../types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isInitialized: boolean; // ← NEW: true once storage has been read

  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  setAuth: (user: User, tokens: AuthTokens) => void;
  clearAuth: () => void;
  initFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isInitialized: false,

  setUser: (user) => {
    setStorageItem('auth_user', user);
    set({ user, isAuthenticated: true });
  },

  setTokens: (tokens) => {
    setStorageItem('auth_tokens', tokens);
    set({ tokens });
  },

  setAuth: (user, tokens) => {
    setStorageItem('auth_user', user);
    setStorageItem('auth_tokens', tokens);
    set({ user, tokens, isAuthenticated: true });
  },

  clearAuth: () => {
    removeStorageItem('auth_user');
    removeStorageItem('auth_tokens');
    set({ user: null, tokens: null, isAuthenticated: false });
  },

  // FIX: always sets isInitialized: true so ProtectedRoute unblocks,
  // regardless of whether tokens were found.
  initFromStorage: () => {
    const user = getStorageItem<User>('auth_user');
    const tokens = getStorageItem<AuthTokens>('auth_tokens');
    if (user && tokens) {
      set({ user, tokens, isAuthenticated: true, isInitialized: true });
    } else {
      set({ isInitialized: true });
    }
  },
}));
