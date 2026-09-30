import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useWorkspace } from '../realtime/useWorkspace'

export function DashboardOverviewPage() {
  const { devices: cachedDevices, deviceStatuses, usageSummary, error: errorMessage, store, refreshing } = useWorkspace()
  const devices = useMemo(() => cachedDevices ?? [], [cachedDevices])
  const isLoading = cachedDevices === null
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
  return (
    <section className="dashboard-section">
      <header className="dashboard-section-header">
        <div>
          <h2>Overview</h2>
          <p>Your devices at a glance.</p>
        </div>

      </header>

      {errorMessage ? <p role="alert" className="dashboard-message dashboard-message-error">{errorMessage} <button className="dashboard-secondary-button" onClick={() => store.refresh()} disabled={refreshing}>Retry</button></p> : null}

      

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
          <span>Online</span>
          <strong>{isLoading ? '...' : `${formatCount(connectedDevices)} / ${formatCount(devices.length)}`}</strong>
          <small>{formatCount(disconnectedDevices)} disconnected</small>
        </article>
      </div>

      <div className="dashboard-overview-panels">
        <article className="dashboard-card dashboard-overview-panel">
          <header className="dashboard-overview-panel-header">
            <div>
              <h3>Data transfer</h3>
              <p>Last 24 hours</p>
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
              <h3>Devices</h3>
            </div>
          </header>

          {isLoading ? (
            <p className="dashboard-muted">Loading device statuses...</p>
          ) : devices.length === 0 ? (
            <div className="dashboard-empty-state"><span className="dashboard-empty-icon" aria-hidden="true">+</span><h3>Connect your first device</h3><Link className="dashboard-primary-button dashboard-link-button" to="/iotroot/dashboard/devices?add=1">Add device</Link></div>
          ) : (
            <div className="dashboard-overview-device-list">
              {devices.slice(0, 6).map((device) => {
                const status = deviceStatuses[String(device.id)]

                return (
                  <Link
                    key={device.id}
                    className="dashboard-overview-device-item"
                    to={`/iotroot/dashboard/devices?device=${device.id}`}
                  >
                    <div>
                      <strong>{device.username || `Device #${device.id}`}</strong>
                      <span>{device.clientId || 'No client id'}</span>
                    </div>
                    <span
                      className={
                        status?.connected
                          ? 'dashboard-device-status dashboard-device-status-online'
                          : status ? 'dashboard-device-status dashboard-device-status-offline' : 'dashboard-device-status workspace-status-unknown'
                      }
                    >
                      {status?.connected ? 'Connected' : status ? 'Disconnected' : 'Unknown'}
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

function calculatePercent(value, total) {
  const safeValue = Number(value ?? 0)
  const safeTotal = Number(total ?? 0)
  if (!Number.isFinite(safeValue) || !Number.isFinite(safeTotal) || safeValue <= 0 || safeTotal <= 0) {
    return 0
  }

  return Math.min(100, (safeValue / safeTotal) * 100)
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
