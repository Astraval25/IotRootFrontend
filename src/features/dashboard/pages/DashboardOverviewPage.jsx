import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchDeviceConnectionStatus,
  fetchDevices,
  fetchUserUsageSummary,
} from '../api/deviceApi'
import { API_BASE_URL } from '../../../shared/config/env'
import { getAccessToken } from '../../auth/session/authSession'

export function DashboardOverviewPage() {
  const [devices, setDevices] = useState([])
  const [deviceStatuses, setDeviceStatuses] = useState({})
  const [usageSummary, setUsageSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statusStream, setStatusStream] = useState('connecting')
  const [lastUpdatedAt, setLastUpdatedAt] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isDisposed = false

    async function loadOverview() {
      try {
        const [devicesResponse, statusResponse, usageResponse] = await Promise.all([
          fetchDevices(),
          fetchDeviceConnectionStatus(),
          fetchUserUsageSummary(),
        ])

        if (isDisposed) {
          return
        }

        setDevices(devicesResponse.data ?? [])
        setDeviceStatuses(
          Object.fromEntries((statusResponse.data ?? []).map((row) => [String(row.deviceId), row])),
        )
        setUsageSummary(usageResponse.data ?? null)
        setLastUpdatedAt(new Date().toISOString())
      } catch (error) {
        if (!isDisposed) {
          setErrorMessage(error.message || 'Failed to load dashboard overview.')
        }
      } finally {
        if (!isDisposed) {
          setIsLoading(false)
        }
      }
    }

    loadOverview()

    return () => {
      isDisposed = true
    }
  }, [])

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      return undefined
    }

    let isDisposed = false
    let refreshTimerId = null
    const socket = new WebSocket(buildStatusWsUrl(API_BASE_URL, token))

    async function refreshOverview() {
      try {
        const [devicesResponse, usageResponse] = await Promise.all([
          fetchDevices(),
          fetchUserUsageSummary(),
        ])

        if (isDisposed) {
          return
        }

        setDevices(devicesResponse.data ?? [])
        setUsageSummary(usageResponse.data ?? null)
        setLastUpdatedAt(new Date().toISOString())
      } catch {
        // Keep the live stream running even if one refresh fails.
      }
    }

    socket.onopen = () => {
      setStatusStream('connected')
    }

    socket.onclose = () => {
      setStatusStream('disconnected')
    }

    socket.onerror = () => {
      setStatusStream('error')
    }

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload?.event !== 'device_status_snapshot' || !Array.isArray(payload?.data)) {
          return
        }

        setDeviceStatuses(Object.fromEntries(payload.data.map((row) => [String(row.deviceId), row])))
        setLastUpdatedAt(new Date().toISOString())

        if (refreshTimerId) {
          window.clearTimeout(refreshTimerId)
        }

        refreshTimerId = window.setTimeout(() => {
          refreshOverview()
        }, 300)
      } catch {
        // Ignore malformed websocket payloads.
      }
    }

    return () => {
      isDisposed = true
      if (refreshTimerId) {
        window.clearTimeout(refreshTimerId)
      }
      socket.close()
    }
  }, [])

  const connectedDevices = useMemo(
    () => devices.filter((device) => deviceStatuses[String(device.id)]?.connected).length,
    [devices, deviceStatuses],
  )
  const disconnectedDevices = Math.max(devices.length - connectedDevices, 0)
  const totalMessages =
    (usageSummary?.inboundMessages ?? 0) + (usageSummary?.outboundMessages ?? 0)
  const totalTransfer =
    (usageSummary?.inboundEstimatedTotalBytes ?? 0) +
    (usageSummary?.outboundEstimatedTotalBytes ?? 0)
  const inboundTransfer = usageSummary?.inboundEstimatedTotalBytes ?? 0
  const outboundTransfer = usageSummary?.outboundEstimatedTotalBytes ?? 0
  const streamLabel =
    statusStream === 'connected'
      ? 'Live'
      : statusStream === 'connecting'
        ? 'Connecting'
        : statusStream

  return (
    <section className="dashboard-section">
      <header className="dashboard-section-header">
        <div>
          <h2>Operations Overview</h2>
          <p>Live fleet health, transfer usage, and quick entry points for your device operations.</p>
        </div>

        <div className="dashboard-overview-meta">
          <span
            className={
              statusStream === 'connected'
                ? 'dashboard-device-status dashboard-device-status-online'
                : 'dashboard-device-status dashboard-device-status-offline'
            }
          >
            {streamLabel}
          </span>
          <span className="dashboard-muted">
            {lastUpdatedAt ? `Updated ${formatRelativeTime(lastUpdatedAt)}` : 'Waiting for first update'}
          </span>
        </div>
      </header>

      {errorMessage ? <p className="dashboard-message dashboard-message-error">{errorMessage}</p> : null}

      <div className="dashboard-overview-hero">
        <div>
          <p className="dashboard-overview-kicker">Default Dashboard</p>
          <h3>Keep an eye on device health and message flow in one place.</h3>
          <p className="dashboard-overview-text">
            This page updates while the dashboard stays open, so we can spot connection changes and traffic movement without a manual refresh.
          </p>
        </div>

        <div className="dashboard-overview-actions">
          <Link className="dashboard-primary-button dashboard-link-button" to="/iotroot/dashboard/devices">
            Open Devices
          </Link>
          <Link className="dashboard-secondary-button dashboard-link-button" to="/iotroot/dashboard/topics">
            Open Topics
          </Link>
        </div>
      </div>

      <div className="dashboard-overview-grid">
        <article className="dashboard-card dashboard-overview-card">
          <span>Devices</span>
          <strong>{isLoading ? '...' : formatCount(devices.length)}</strong>
          <small>{formatCount(connectedDevices)} connected now</small>
        </article>

        <article className="dashboard-card dashboard-overview-card">
          <span>Total Transfer</span>
          <strong>{isLoading ? '...' : formatBytes(totalTransfer)}</strong>
          <small>Last 24 hours</small>
        </article>

        <article className="dashboard-card dashboard-overview-card">
          <span>Total Messages</span>
          <strong>{isLoading ? '...' : formatCount(totalMessages)}</strong>
          <small>Inbound + outbound</small>
        </article>

        <article className="dashboard-card dashboard-overview-card">
          <span>Fleet Health</span>
          <strong>{isLoading ? '...' : `${formatCount(connectedDevices)} / ${formatCount(devices.length)}`}</strong>
          <small>{formatCount(disconnectedDevices)} disconnected</small>
        </article>
      </div>

      <div className="dashboard-overview-panels">
        <article className="dashboard-card dashboard-overview-panel">
          <header className="dashboard-overview-panel-header">
            <div>
              <h3>Traffic Mix</h3>
              <p>Estimated broker transfer volume across your account.</p>
            </div>
          </header>

          <div className="dashboard-usage-bar-track">
            <div
              className="dashboard-usage-bar dashboard-usage-bar-inbound"
              style={{ width: `${calculatePercent(inboundTransfer, totalTransfer)}%` }}
            />
            <div
              className="dashboard-usage-bar dashboard-usage-bar-outbound"
              style={{ width: `${calculatePercent(outboundTransfer, totalTransfer)}%` }}
            />
          </div>

          <div className="dashboard-usage-legend">
            <div>
              <span className="dashboard-usage-dot dashboard-usage-dot-inbound" />
              <strong>Inbound</strong>
              <small>{formatBytes(inboundTransfer)}</small>
            </div>
            <div>
              <span className="dashboard-usage-dot dashboard-usage-dot-outbound" />
              <strong>Outbound</strong>
              <small>{formatBytes(outboundTransfer)}</small>
            </div>
          </div>
        </article>

        <article className="dashboard-card dashboard-overview-panel">
          <header className="dashboard-overview-panel-header">
            <div>
              <h3>Device Status</h3>
              <p>Quick live view of the latest known broker session state.</p>
            </div>
          </header>

          {isLoading ? (
            <p className="dashboard-muted">Loading device statuses...</p>
          ) : devices.length === 0 ? (
            <p className="dashboard-muted">No devices created yet.</p>
          ) : (
            <div className="dashboard-overview-device-list">
              {devices.slice(0, 6).map((device) => {
                const status = deviceStatuses[String(device.id)]

                return (
                  <Link
                    key={device.id}
                    className="dashboard-overview-device-item"
                    to="/iotroot/dashboard/devices"
                  >
                    <div>
                      <strong>{device.username || `Device #${device.id}`}</strong>
                      <span>{device.clientId || 'No client id'}</span>
                    </div>
                    <span
                      className={
                        status?.connected
                          ? 'dashboard-device-status dashboard-device-status-online'
                          : 'dashboard-device-status dashboard-device-status-offline'
                      }
                    >
                      {status?.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </article>
      </div>
    </section>
  )
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

function calculatePercent(value, total) {
  const safeValue = Number(value ?? 0)
  const safeTotal = Number(total ?? 0)
  if (!Number.isFinite(safeValue) || !Number.isFinite(safeTotal) || safeValue <= 0 || safeTotal <= 0) {
    return 0
  }

  return Math.max(8, Math.min(100, Math.round((safeValue / safeTotal) * 100)))
}

function formatBytes(value) {
  const size = Number(value ?? 0)
  if (!Number.isFinite(size) || size <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let nextValue = size
  let unitIndex = 0

  while (nextValue >= 1024 && unitIndex < units.length - 1) {
    nextValue /= 1024
    unitIndex += 1
  }

  const digits = nextValue >= 100 || unitIndex === 0 ? 0 : 1
  return `${nextValue.toFixed(digits)} ${units[unitIndex]}`
}

function formatCount(value) {
  const count = Number(value ?? 0)
  if (!Number.isFinite(count)) {
    return '0'
  }

  return new Intl.NumberFormat('en-US').format(count)
}

function formatRelativeTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'just now'
  }

  const differenceMs = Date.now() - date.getTime()
  const seconds = Math.max(1, Math.round(differenceMs / 1000))
  if (seconds < 60) {
    return `${seconds}s ago`
  }

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.round(minutes / 60)
  return `${hours}h ago`
}
