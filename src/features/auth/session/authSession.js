const AUTH_STORAGE_KEY = 'iotroot.auth.session'

function readSession() {
  const rawValue = localStorage.getItem(AUTH_STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue)
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

function writeSession(session) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function saveTokens(tokenData) {
  if (!tokenData?.accessToken || !tokenData?.refreshToken) {
    return null
  }

  const existingSession = readSession() ?? {}
  const currentTime = Date.now()
  const accessTtlMs = Number(tokenData.expiresInSeconds ?? 0) * 1000
  const refreshTtlMs = Number(tokenData.refreshExpiresInSeconds ?? 0) * 1000

  const nextSession = {
    ...existingSession,
    accessToken: tokenData.accessToken,
    refreshToken: tokenData.refreshToken,
    tokenType: tokenData.tokenType || existingSession.tokenType || 'Bearer',
    expiresAt: accessTtlMs > 0 ? currentTime + accessTtlMs : existingSession.expiresAt ?? null,
    refreshExpiresAt:
      refreshTtlMs > 0 ? currentTime + refreshTtlMs : existingSession.refreshExpiresAt ?? null,
  }

  writeSession(nextSession)
  return nextSession
}

export function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function getSession() {
  return readSession()
}

export function getAccessToken() {
  return readSession()?.accessToken ?? null
}

export function getRefreshToken() {
  return readSession()?.refreshToken ?? null
}

export function getAuthorizationHeader() {
  const session = readSession()

  if (!session?.accessToken) {
    return null
  }

  return `${session.tokenType || 'Bearer'} ${session.accessToken}`
}

export function isAccessTokenExpired(skewSeconds = 20) {
  const session = readSession()

  if (!session?.accessToken) {
    return true
  }

  if (!session.expiresAt) {
    return false
  }

  return Date.now() + skewSeconds * 1000 >= session.expiresAt
}

export function isRefreshTokenExpired(skewSeconds = 20) {
  const session = readSession()

  if (!session?.refreshToken) {
    return true
  }

  if (!session.refreshExpiresAt) {
    return false
  }

  return Date.now() + skewSeconds * 1000 >= session.refreshExpiresAt
}
