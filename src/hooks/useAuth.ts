import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '../store/authStore'
import { authApi } from '../api/auth.api'
import type { LoginRequest, RegisterRequest } from '../types'
import { queryClient } from '../lib/queryClient'
import { takeReturnPath } from '../lib/post-auth-redirect'


export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore()
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    enabled: isAuthenticated,
    select: (data) => data.user,
  })
}

export function useLogin() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: (data) => {
      setAuth(data.user, data.tokens)
      queryClient.setQueryData(['auth', 'me'], { user: data.user })
      toast.success('Successfully logged in!')
      // Back to whatever sent them here — an interview invitation, usually.
      // Always landing on /dashboard loses the thing they were trying to do.
      navigate(takeReturnPath())
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Login failed')
    }
  })
}

export function useRegister() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: () => {
      toast.success('Account created! Please check your email.')
      navigate('/login?registered=true')
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Registration failed')
    }
  })
}

export function useLogout() {
  const { clearAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    // Always called. The server is the only thing that can clear the refresh
    // cookie, and it needs the request to do it. This previously skipped the
    // call when no refresh token was held in memory — which, now that tokens
    // are not stored client-side, would be every time, leaving the cookie in
    // place on sign-out.
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearAuth()
      queryClient.clear()
      toast.info('Logged out')
      navigate('/login')
    },
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => toast.success('Password reset email sent!'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => toast.error(error.response?.data?.error?.message || 'Failed to send reset email')
  })
}

export function useResetPassword() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authApi.resetPassword(token, newPassword),
    onSuccess: () => {
      toast.success('Password reset successfully!')
      navigate('/login?reset=true')
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => toast.error(error.response?.data?.error?.message || 'Failed to reset password')
  })
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token),
    onSuccess: () => toast.success('Email verified successfully!'),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => toast.error(error.response?.data?.error?.message || 'Verification failed')
  })
}
