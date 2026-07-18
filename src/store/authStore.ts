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

import axios from 'axios';
import { create } from 'zustand';
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from '@/utils/formatters';
import { clearAccessToken, setAccessToken } from '@/api/access-token';
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
  initAuth: () => Promise<void>;
}

/** Guards against overlapping refreshes; see initAuth. */
let initInFlight: Promise<void> | null = null;

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
    // Held in memory only. The refresh token is not stored at all — it lives
    // in an httpOnly cookie the browser manages and this code cannot read.
    setAccessToken(tokens.accessToken);
    set({ tokens });
  },

  setAuth: (user, tokens) => {
    setStorageItem('auth_user', user);
    setAccessToken(tokens.accessToken);
    set({ user, tokens, isAuthenticated: true });
  },

  clearAuth: () => {
    removeStorageItem('auth_user');
    // Left over from when tokens were persisted. Removed on every sign-out so
    // an existing session does not keep a stale credential in storage.
    removeStorageItem('auth_tokens');
    clearAccessToken();
    set({ user: null, tokens: null, isAuthenticated: false });
  },

  /**
   * Restore the session on boot.
   *
   * The refresh cookie is the source of truth, not localStorage. A stored user
   * is only a display convenience and must never decide whether someone is
   * signed in — if it did, clearing site data would sign out a user whose
   * cookie is perfectly valid, and a stale entry would show a signed-in shell
   * the API then rejects.
   *
   * So: exchange the cookie for an access token, then ask the API who this is.
   *
   * isInitialized is always set at the end, whether or not that succeeds,
   * because ProtectedRoute blocks on it and would otherwise hang forever on a
   * loading screen.
   */
  initAuth: async () => {
    // The refresh token is rotated on every use, so two concurrent calls make
    // the second one present a token the server has already retired and fail.
    // React StrictMode double-invokes effects in development, which is exactly
    // that case — it used to log the user out on the following reload.
    if (initInFlight) return initInFlight;

    initInFlight = (async () => {
      const apiBase = (import.meta.env.VITE_API_URL as string) || '/api';

      try {
        const { data } = await axios.post(
          `${apiBase}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const tokens: AuthTokens = data.data.tokens;
        setAccessToken(tokens.accessToken);

        const me = await axios.get(`${apiBase}/auth/me`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        const user: User = me.data.data;

        // Kept so the shell can render a name before the first request
        // resolves. It is not consulted when deciding authentication.
        setStorageItem('auth_user', user);
        set({ user, tokens, isAuthenticated: true, isInitialized: true });
      } catch {
        removeStorageItem('auth_user');
        clearAccessToken();
        set({ user: null, tokens: null, isAuthenticated: false, isInitialized: true });
      } finally {
        initInFlight = null;
      }
    })();

    return initInFlight;
  },
}));
