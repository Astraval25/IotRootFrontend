import { apiPost } from '../../../shared/api/httpClient'
import {
  clearSession,
  getRefreshToken,
  isAccessTokenExpired,
  isRefreshTokenExpired,
  saveTokens,
} from '../session/authSession'

export async function loginUser(payload) {
  const response = await apiPost('/api/auth/login', payload)

  if (response.data?.accessToken && response.data?.refreshToken) {
    saveTokens(response.data)
  }

  return response
}

export function registerUser(payload) {
  return apiPost('/api/auth/register', payload)
}

export function verifyOtp(payload) {
  return apiPost('/api/auth/verify-otp', payload)
}

export function resendOtp(payload) {
  return apiPost('/api/auth/resend-otp', payload)
}

export function forgotPassword(payload) {
  return apiPost('/api/auth/forgot-password', payload)
}

export function resetPassword(payload) {
  return apiPost('/api/auth/reset-password', payload)
}

export async function refreshTokenSession() {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    throw new Error('No refresh token found.')
  }

  const response = await apiPost('/api/auth/refresh-token', { refreshToken })

  if (response.data?.accessToken && response.data?.refreshToken) {
    saveTokens(response.data)
  }

  return response
}

export async function hydrateSessionIfNeeded() {
  const refreshToken = getRefreshToken()

  if (!refreshToken || isRefreshTokenExpired() || !isAccessTokenExpired()) {
    return
  }

  try {
    await refreshTokenSession()
  } catch {
    clearSession()
  }
}

export function logoutUser() {
  clearSession()
}
