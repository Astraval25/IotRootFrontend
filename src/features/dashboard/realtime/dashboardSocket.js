import { API_BASE_URL } from '../../../shared/config/env'

export function openDashboardSocket({ token, onStatusChange, onEvent }) {
  let socket = null
  let reconnectTimerId = null
  let disposed = false
  let reconnectAttempt = 0

  function connect() {
    if (disposed || !token) {
      return
    }

    onStatusChange?.(reconnectAttempt === 0 ? 'connecting' : 'reconnecting')
    socket = new WebSocket(buildStatusWsUrl(API_BASE_URL, token))

    socket.onopen = () => {
      reconnectAttempt = 0
      onStatusChange?.('connected')
    }

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        onEvent?.(payload)
      } catch {
        // Ignore malformed payloads and keep the stream alive.
      }
    }

    socket.onerror = () => {
      onStatusChange?.('error')
    }

    socket.onclose = () => {
      if (disposed) {
        onStatusChange?.('disconnected')
        return
      }

      onStatusChange?.('reconnecting')
      reconnectAttempt += 1
      const delayMs = Math.min(5000, 1000 * reconnectAttempt)
      reconnectTimerId = window.setTimeout(connect, delayMs)
    }
  }

  connect()

  return () => {
    disposed = true
    if (reconnectTimerId) {
      window.clearTimeout(reconnectTimerId)
    }
    if (socket) {
      socket.close()
    }
  }
}

function buildStatusWsUrl(apiBaseUrl, token) {
  let resolvedUrl

  try {
    resolvedUrl = new URL(apiBaseUrl)
  } catch {
    resolvedUrl = new URL(window.location.origin)
  }

  const wsProtocol = resolvedUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  const basePath = resolvedUrl.pathname.endsWith('/') ? resolvedUrl.pathname.slice(0, -1) : resolvedUrl.pathname
  const wsPath = `${basePath}/ws/device-status`.replace(/\/{2,}/g, '/')

  return `${wsProtocol}//${resolvedUrl.host}${wsPath}?token=${encodeURIComponent(token)}`
}
