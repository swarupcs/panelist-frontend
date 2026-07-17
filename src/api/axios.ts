import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { getStorageItem, setStorageItem, removeStorageItem } from '@/utils/formatters'
import type { AuthTokens } from '../types'


const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// ── Request interceptor — inject token ─────────────────────────────────────

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokens = getStorageItem<AuthTokens>('auth_tokens')
    if (tokens?.accessToken) {
      config.headers['Authorization'] = `Bearer ${tokens.accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response interceptor — auto-refresh on 401 ────────────────────────────

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error)
    else p.resolve(token!)
  })
  failedQueue = []
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`
            return axiosInstance(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const tokens = getStorageItem<AuthTokens>('auth_tokens')
        if (!tokens?.refreshToken) throw new Error('No refresh token')

        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken: tokens.refreshToken,
        })

        const newTokens: AuthTokens = response.data.data.tokens
        setStorageItem('auth_tokens', newTokens)

        axiosInstance.defaults.headers.common['Authorization'] =
          `Bearer ${newTokens.accessToken}`

        processQueue(null, newTokens.accessToken)
        originalRequest.headers['Authorization'] = `Bearer ${newTokens.accessToken}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        removeStorageItem('auth_tokens')
        removeStorageItem('auth_user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default axiosInstance
