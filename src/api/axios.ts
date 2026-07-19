import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { removeStorageItem } from '@/utils/formatters'
import { clearAccessToken, getAccessToken, setAccessToken } from './access-token'
import { isCredentialRejection } from './auth-failure'
import type { AuthTokens } from '../types'


const BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  // Required for the httpOnly refresh cookie to reach the API. The API must
  // name this origin explicitly in its CORS config — browsers refuse to send
  // credentials to a wildcard origin.
  withCredentials: true,
})

// ── Request interceptor — inject token ─────────────────────────────────────

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
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

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/login')) {
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
        // No token in the body: the refresh token travels as an httpOnly
        // cookie the browser attaches itself, so it is never exposed to this
        // code and cannot be read by anything else running on the page.
        const response = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        )

        const newTokens: AuthTokens = response.data.data.tokens
        setAccessToken(newTokens.accessToken)

        axiosInstance.defaults.headers.common['Authorization'] =
          `Bearer ${newTokens.accessToken}`

        processQueue(null, newTokens.accessToken)
        originalRequest.headers['Authorization'] = `Bearer ${newTokens.accessToken}`
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)

        // Only a refusal ends the session. If the refresh call simply could
        // not be delivered — the API restarting, a dropped connection — then
        // nothing has been learned about the cookie, and throwing the user out
        // to /login destroys a session that was never actually invalidated.
        // The request still fails; the credentials survive to be retried.
        if (!isCredentialRejection(refreshError)) {
          return Promise.reject(refreshError)
        }

        clearAccessToken()
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
