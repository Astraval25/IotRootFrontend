import {
  clearSession,
  getAuthorizationHeader,
  getRefreshToken,
  isAccessTokenExpired,
  isRefreshTokenExpired,
  saveTokens,
} from '../../features/auth/session/authSession'
import { API_BASE_URL } from '../config/env'

export class ApiError extends Error {
  constructor(message, code, response) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.response = response
  }
}

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

async function parseApiResponse(response) {
  const rawText = await response.text()

  if (!rawText) {
    return {
      status: response.ok,
      code: response.status,
      message: response.ok ? 'Request successful' : 'Request failed',
      data: null,
    }
  }

  try {
    const parsedBody = JSON.parse(rawText)
    return {
      status: parsedBody.status ?? response.ok,
      code: parsedBody.code ?? response.status,
      message: parsedBody.message ?? (response.ok ? 'Request successful' : response.statusText),
      data: parsedBody.data ?? null,
    }
  } catch {
    return {
      status: response.ok,
      code: response.status,
      message: rawText,
      data: null,
    }
  }
}

let refreshPromise = null

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken()

    if (!refreshToken || isRefreshTokenExpired()) {
      clearSession()
      return false
    }

    try {
      const response = await fetch(buildUrl('/api/auth/refresh-token'), {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      const parsedResponse = await parseApiResponse(response)

      if (!response.ok || parsedResponse.status === false || !parsedResponse.data?.accessToken) {
        clearSession()
        return false
      }

      saveTokens(parsedResponse.data)
      return true
    } catch {
      clearSession()
      return false
    }
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

async function withAuthHeaders(headers) {
  const nextHeaders = new Headers(headers || {})

  if (isAccessTokenExpired()) {
    const refreshed = await refreshAccessToken()

    if (!refreshed) {
      throw new ApiError('Session expired. Please log in again.', 401, null)
    }
  }

  const authorizationHeader = getAuthorizationHeader()

  if (authorizationHeader) {
    nextHeaders.set('Authorization', authorizationHeader)
  }

  return nextHeaders
}

export async function apiRequest(
  path,
  { method = 'GET', body, headers, requiresAuth = false, retryOnUnauthorized = true } = {},
) {
  const baseHeaders = new Headers(headers || {})
  baseHeaders.set('Accept', 'application/json')

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  if (!isFormData && body !== undefined) {
    baseHeaders.set('Content-Type', 'application/json')
  }

  const requestHeaders = requiresAuth ? await withAuthHeaders(baseHeaders) : baseHeaders

  const response = await fetch(buildUrl(path), {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  })

  const parsedResponse = await parseApiResponse(response)
  const isUnauthorized = response.status === 401 || parsedResponse.code === 401

  if (requiresAuth && isUnauthorized && retryOnUnauthorized) {
    const refreshed = await refreshAccessToken()

    if (refreshed) {
      return apiRequest(path, {
        method,
        body,
        headers,
        requiresAuth,
        retryOnUnauthorized: false,
      })
    }

    throw new ApiError('Session expired. Please log in again.', 401, parsedResponse)
  }

  const isSuccess = response.ok && parsedResponse.status !== false

  if (!isSuccess) {
    throw new ApiError(
      parsedResponse.message || 'Something went wrong. Please try again.',
      parsedResponse.code ?? response.status,
      parsedResponse,
    )
  }

  return parsedResponse
}

export function apiGet(path, options = {}) {
  return apiRequest(path, { ...options, method: 'GET' })
}

export function apiPost(path, body, options = {}) {
  return apiRequest(path, { ...options, method: 'POST', body })
}

export function apiPut(path, body, options = {}) {
  return apiRequest(path, { ...options, method: 'PUT', body })
}

export function apiDelete(path, options = {}) {
  return apiRequest(path, { ...options, method: 'DELETE' })
}
