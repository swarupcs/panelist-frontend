import type { AuthTokens, LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User } from '../types'
import api from './axios'
import { 
} from '@/types'

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await api.post('/auth/login', data)
    return res.data.data
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const res = await api.post('/auth/register', data)
    return res.data.data
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken })
  },

  refreshToken: async (refreshToken: string): Promise<{ tokens: AuthTokens }> => {
    const res = await api.post('/auth/refresh', { refreshToken })
    return res.data.data
  },

  me: async (): Promise<{ user: User }> => {
    const res = await api.get('/auth/me')
    return res.data.data
  },

  verifyEmail: async (token: string): Promise<{ user: User }> => {
    const res = await api.get(`/auth/verify-email?token=${token}`)
    return res.data.data
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const res = await api.post('/auth/forgot-password', { email })
    return res.data.data
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const res = await api.post('/auth/reset-password', { token, newPassword })
    return res.data.data
  },

  setPassword: async (newPassword: string): Promise<{ message: string }> => {
    const res = await api.post('/auth/set-password', { newPassword })
    return res.data.data
  },
}
