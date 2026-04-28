import { useEffect, useState } from 'react'
import {
  createDevice,
  deleteDevice,
  fetchDeviceById,
  fetchDeviceUsageBuckets,
  fetchDeviceUsageSummary,
  fetchDeviceConnectionStatus,
  fetchDeviceRules,
  fetchDevices,
  updateDevice,
} from '../api/deviceApi'
import { API_BASE_URL } from '../../../shared/config/env'
import { getAccessToken } from '../../auth/session/authSession'
import { openDashboardSocket } from '../realtime/dashboardSocket'

const initialForm = {
  username: '',
  password: '',
  mountpoint: '',
}

export function DashboardDevicesPage() {
  const [devices, setDevices] = useState([])
  const [form, setForm] = useState(initialForm)
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [selectedDeviceRules, setSelectedDeviceRules] = useState([])
  const [selectedDeviceUsageSummary, setSelectedDeviceUsageSummary] = useState(null)
  const [selectedDeviceUsageBuckets, setSelectedDeviceUsageBuckets] = useState([])
  const [deviceStatuses, setDeviceStatuses] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingRules, setIsLoadingRules] = useState(false)
  const [isLoadingUsage, setIsLoadingUsage] = useState(false)
  const [isLoadingStatus, setIsLoadingStatus] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedKey, setCopiedKey] = useState('')
  const [statusStream, setStatusStream] = useState('connecting')
  const [lastUsageUpdatedAt, setLastUsageUpdatedAt] = useState('')

  async function loadDevices(showLoader = false) {
    if (showLoader) {
      setIsLoading(true)
    }

    try {
      const response = await fetchDevices()
      const nextDevices = response.data ?? []
      setDevices(nextDevices)
      setSelectedDeviceId((previous) => {
        if (previous && nextDevices.some((device) => String(device.id) === previous)) {
          return previous
        }
        return nextDevices[0]?.id ? String(nextDevices[0].id) : ''
      })
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load devices.')
    } finally {
      setIsLoading(false)
    }
  }

  async function loadConnectionStatuses(showLoader = false) {
    if (showLoader) {
      setIsLoadingStatus(true)
    }

    try {
      const response = await fetchDeviceConnectionStatus()
      const byDeviceId = Object.fromEntries((response.data ?? []).map((row) => [String(row.deviceId), row]))
      setDeviceStatuses(byDeviceId)
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load connection status.')
    } finally {
      setIsLoadingStatus(false)
    }
  }

  useEffect(() => {
    let isDisposed = false

    async function initializeDevices() {
      try {
        const [devicesResponse, statusResponse] = await Promise.all([
          fetchDevices(),
          fetchDeviceConnectionStatus(),
        ])

        if (!isDisposed) {
          const nextDevices = devicesResponse.data ?? []
          const byDeviceId = Object.fromEntries(
            (statusResponse.data ?? []).map((row) => [String(row.deviceId), row]),
          )
          setDevices(nextDevices)
          setDeviceStatuses(byDeviceId)
          setSelectedDeviceId(nextDevices[0]?.id ? String(nextDevices[0].id) : '')
        }
      } catch (error) {
        if (!isDisposed) {
          setErrorMessage(error.message || 'Failed to load devices.')
        }
      } finally {
        if (!isDisposed) {
          setIsLoading(false)
        }
      }
    }

    initializeDevices()

    return () => {
      isDisposed = true
    }
  }, [])

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      return undefined
    }

    return openDashboardSocket({
      token,
      onStatusChange: setStatusStream,
      onEvent: (payload) => {
        if (payload?.event === 'device_status_snapshot' && Array.isArray(payload?.data)) {
          const byDeviceId = Object.fromEntries(payload.data.map((row) => [String(row.deviceId), row]))
          setDeviceStatuses(byDeviceId)
          return
        }

        if (
          payload?.event === 'device_usage_snapshot' &&
          payload?.data &&
          String(payload.data.deviceId) === String(selectedDeviceId)
        ) {
          setSelectedDeviceUsageSummary(payload.data.deviceSummary ?? null)
          setSelectedDeviceUsageBuckets(payload.data.recentBuckets ?? [])
          setLastUsageUpdatedAt(new Date().toISOString())
        }
      },
    })
  }, [selectedDeviceId])

  useEffect(() => {
    if (!selectedDeviceId) {
      return
    }

    let isDisposed = false

    async function loadRules() {
      setIsLoadingRules(true)
      try {
        const response = await fetchDeviceRules(selectedDeviceId)
        if (!isDisposed) {
          setSelectedDeviceRules(response.data ?? [])
        }
      } catch {
        if (!isDisposed) {
          setSelectedDeviceRules([])
        }
      } finally {
        if (!isDisposed) {
          setIsLoadingRules(false)
        }
      }
    }

    loadRules()

    return () => {
      isDisposed = true
    }
  }, [selectedDeviceId])

  useEffect(() => {
    if (!selectedDeviceId) {
      return
    }

    let isDisposed = false

    async function loadUsage() {
      setIsLoadingUsage(true)
      try {
        const [summaryResponse, bucketsResponse] = await Promise.all([
          fetchDeviceUsageSummary(selectedDeviceId),
          fetchDeviceUsageBuckets(selectedDeviceId),
        ])

        if (!isDisposed) {
          setSelectedDeviceUsageSummary(summaryResponse.data ?? null)
          setSelectedDeviceUsageBuckets(bucketsResponse.data ?? [])
          setLastUsageUpdatedAt(new Date().toISOString())
        }
      } catch {
        if (!isDisposed) {
          setSelectedDeviceUsageSummary(null)
          setSelectedDeviceUsageBuckets([])
        }
      } finally {
        if (!isDisposed) {
          setIsLoadingUsage(false)
        }
      }
    }

    loadUsage()

    return () => {
      isDisposed = true
    }
  }, [selectedDeviceId])

  function updateForm(key, value) {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  function resetForm() {
    setForm(initialForm)
    setEditingId(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const payload = {
        username: form.username.trim(),
        password: form.password,
        mountpoint: form.mountpoint.trim(),
      }

      if (editingId) {
        const response = await updateDevice(editingId, payload)
        setMessage(response.message || 'Device updated.')
      } else {
        const response = await createDevice(payload)
        setMessage(response.message || 'Device created.')
      }

      resetForm()
      await loadDevices()
      await loadConnectionStatuses()
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save device.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEdit(deviceId) {
    setMessage('')
    setErrorMessage('')

    try {
      const response = await fetchDeviceById(deviceId)
      const device = response.data

      setEditingId(device.id)
      setForm({
        username: device.username || '',
        password: '',
        mountpoint: device.mountpoint || '',
      })
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load device details.')
    }
  }

  async function handleDelete(deviceId) {
    setMessage('')
    setErrorMessage('')

    try {
      const response = await deleteDevice(deviceId)
      setMessage(response.message || 'Device deleted.')

      if (editingId === deviceId) {
        resetForm()
      }

      await loadDevices()
      await loadConnectionStatuses()
    } catch (error) {
      setErrorMessage(error.message || 'Failed to delete device.')
    }
  }

  async function copyText(key, text) {
    if (!text) {
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(''), 1400)
    } catch {
      setErrorMessage('Failed to copy to clipboard.')
    }
  }

  const selectedDevice =
    devices.find((device) => String(device.id) === String(selectedDeviceId)) ?? null
  const selectedDeviceStatus = selectedDeviceId ? deviceStatuses[String(selectedDeviceId)] : null
  const brokerHost = selectedDeviceStatus?.brokerHost || (() => {
    try {
      return new URL(API_BASE_URL).hostname
    } catch {
      return 'iotroot.astraval.com'
    }
  })()
  const brokerPort = String(selectedDeviceStatus?.brokerPort || 1883)
  const brokerUrl = `${brokerHost}:${brokerPort}`
  const sampleTopic =
    selectedDeviceRules[0]?.topic || `/iot/${selectedDevice?.id || 'userId'}/sample/topic`
  const publishAllowed = selectedDeviceRules.filter(
    (rule) => rule.permission === 'publish' || rule.permission === 'readwrite',
  )
  const subscribeAllowed = selectedDeviceRules.filter(
    (rule) => rule.permission === 'subscribe' || rule.permission === 'readwrite',
  )
  const publishTopic = publishAllowed[0]?.topic || sampleTopic
  const subscribeTopic = subscribeAllowed[0]?.topic || sampleTopic
  const clientId = selectedDevice?.clientId || `device-${selectedDevice?.id || 'id'}`
  const username = selectedDevice?.username || 'device_username'
  const passwordPlaceholder = '<DEVICE_PASSWORD>'
  const publishCommand = `mosquitto_pub -h ${brokerHost} -p ${brokerPort} -u "${username}" -P "${passwordPlaceholder}" -i "${clientId}" -t "${publishTopic}" -m "{\\"status\\":\\"ok\\"}" -q 1`
  const subscribeCommand = `mosquitto_sub -h ${brokerHost} -p ${brokerPort} -u "${username}" -P "${passwordPlaceholder}" -i "${clientId}" -t "${subscribeTopic}" -q 1 -v`
  const inboundPayloadBytes = selectedDeviceUsageSummary?.inboundPayloadBytes ?? 0
  const outboundPayloadBytes = selectedDeviceUsageSummary?.outboundPayloadBytes ?? 0
  const inboundEstimatedBytes = selectedDeviceUsageSummary?.inboundEstimatedTotalBytes ?? 0
  const outboundEstimatedBytes = selectedDeviceUsageSummary?.outboundEstimatedTotalBytes ?? 0
  const inboundMessages = selectedDeviceUsageSummary?.inboundMessages ?? 0
  const outboundMessages = selectedDeviceUsageSummary?.outboundMessages ?? 0
  const totalPayloadBytes = inboundPayloadBytes + outboundPayloadBytes
  const totalEstimatedBytes = inboundEstimatedBytes + outboundEstimatedBytes
  const totalMessages = inboundMessages + outboundMessages
  const inboundPercent = totalEstimatedBytes > 0 ? Math.round((inboundEstimatedBytes / totalEstimatedBytes) * 100) : 0
  const outboundPercent = totalEstimatedBytes > 0 ? 100 - inboundPercent : 0
  const recentUsageBuckets = selectedDeviceUsageBuckets.slice(-6).reverse()
  const busiestBucket = selectedDeviceUsageBuckets.reduce((largest, bucket) => {
    if (!largest || (bucket.estimatedTotalBytes ?? 0) > (largest.estimatedTotalBytes ?? 0)) {
      return bucket
    }
    return largest
  }, null)
  const busiestTopic = busiestBucket?.topic || 'No traffic yet'

  return (
    <section className="dashboard-section">
      <header className="dashboard-section-header">
        <div>
          <h2>Device Management</h2>
          <p>Manage connected device credentials and identifiers for your IoT platform.</p>
        </div>

        <button
          className="dashboard-secondary-button"
          type="button"
          onClick={async () => {
            await loadDevices(true)
            await loadConnectionStatuses(true)
          }}
        >
          Refresh
        </button>
      </header>
      <p className="dashboard-muted">
        Status Stream:{' '}
        <span
          className={
            statusStream === 'connected'
              ? 'dashboard-device-status dashboard-device-status-online'
              : 'dashboard-device-status dashboard-device-status-offline'
          }
        >
          {statusStream}
        </span>
        {lastUsageUpdatedAt ? ` | Usage updated ${formatRelativeTime(lastUsageUpdatedAt)}` : ''}
      </p>

      <div className="dashboard-grid dashboard-grid-devices">
        <article className="dashboard-card">
          <h3>{editingId ? `Edit Device #${editingId}` : 'Create Device'}</h3>
          <form className="dashboard-form" onSubmit={handleSubmit}>
            <label htmlFor="device-username">
              Username
              <input
                id="device-username"
                value={form.username}
                onChange={(event) => updateForm('username', event.target.value)}
                placeholder="node_1"
                required
              />
            </label>

            <label htmlFor="device-password">
              Password
              <input
                id="device-password"
                type="password"
                value={form.password}
                onChange={(event) => updateForm('password', event.target.value)}
                placeholder={editingId ? 'Enter new password' : 'Enter password'}
                required
              />
            </label>

            <label htmlFor="device-mountpoint">
              Mountpoint
              <input
                id="device-mountpoint"
                value={form.mountpoint}
                onChange={(event) => updateForm('mountpoint', event.target.value)}
                placeholder="/"
              />
            </label>

            <div className="dashboard-form-actions">
              <button className="dashboard-primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingId ? 'Update Device' : 'Create Device'}
              </button>

              {editingId ? (
                <button
                  className="dashboard-secondary-button"
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>

          {errorMessage ? <p className="dashboard-message dashboard-message-error">{errorMessage}</p> : null}
          {message ? <p className="dashboard-message dashboard-message-success">{message}</p> : null}
        </article>

        <article className="dashboard-card">
          <h3>Devices</h3>
          {isLoading ? (
            <p className="dashboard-muted">Loading devices...</p>
          ) : devices.length === 0 ? (
            <p className="dashboard-muted">No devices found.</p>
          ) : (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Client ID</th>
                    <th>Mountpoint</th>
                    <th>Status</th>
                    <th>Select</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => (
                    <tr
                      key={device.id}
                      className={String(device.id) === String(selectedDeviceId) ? 'dashboard-row-selected' : ''}
                    >
                      <td>{device.id}</td>
                      <td>{device.username || '-'}</td>
                      <td className="dashboard-truncate">{device.clientId || '-'}</td>
                      <td>{device.mountpoint || '-'}</td>
                      <td>
                        <span
                          className={
                            deviceStatuses[String(device.id)]?.connected
                              ? 'dashboard-device-status dashboard-device-status-online'
                              : 'dashboard-device-status dashboard-device-status-offline'
                          }
                        >
                          {deviceStatuses[String(device.id)]?.connected ? 'Connected' : 'Disconnected'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="dashboard-inline-action"
                          onClick={() => setSelectedDeviceId(String(device.id))}
                        >
                          {String(device.id) === String(selectedDeviceId) ? 'Selected' : 'Use'}
                        </button>
                      </td>
                      <td>
                        <div className="dashboard-row-actions">
                          <button type="button" onClick={() => handleEdit(device.id)}>
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDelete(device.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </div>

      <article className="dashboard-card dashboard-details-card">
        <header className="dashboard-details-header">
          <div>
            <h3>Connection Details</h3>
            <p>Use these details with Mosquitto CLI to test publish/subscribe against ACL permissions.</p>
          </div>
          <span className="dashboard-details-badge">{selectedDevice ? `Device #${selectedDevice.id}` : 'No device'}</span>
        </header>

        {!selectedDevice ? (
          <p className="dashboard-muted">Select a device from the table to generate commands.</p>
        ) : (
          <>
            <div className="dashboard-details-grid">
              <div className="dashboard-detail-item">
                <span>URL</span>
                <strong>{brokerUrl}</strong>
                <button
                  type="button"
                  className="dashboard-inline-action"
                  onClick={() => copyText('url', brokerUrl)}
                >
                  {copiedKey === 'url' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="dashboard-detail-item">
                <span>Connection</span>
                <strong>{selectedDeviceStatus?.connected ? 'Connected' : 'Disconnected'}</strong>
              </div>
              <div className="dashboard-detail-item">
                <span>Host</span>
                <strong>{brokerHost}</strong>
                <button
                  type="button"
                  className="dashboard-inline-action"
                  onClick={() => copyText('host', brokerHost)}
                >
                  {copiedKey === 'host' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="dashboard-detail-item">
                <span>Port</span>
                <strong>{brokerPort}</strong>
                <button
                  type="button"
                  className="dashboard-inline-action"
                  onClick={() => copyText('port', brokerPort)}
                >
                  {copiedKey === 'port' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="dashboard-detail-item">
                <span>Username</span>
                <strong>{username}</strong>
                <button
                  type="button"
                  className="dashboard-inline-action"
                  onClick={() => copyText('username', username)}
                >
                  {copiedKey === 'username' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <section className="dashboard-rules-section">
              <h4>VerneMQ Session Details</h4>
              {isLoadingStatus ? (
                <p className="dashboard-muted">Refreshing session status...</p>
              ) : (
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <tbody>
                      <tr>
                        <th>Status Source</th>
                        <td>{selectedDeviceStatus?.statusSource || '-'}</td>
                      </tr>
                      <tr>
                        <th>Node</th>
                        <td>{selectedDeviceStatus?.node || '-'}</td>
                      </tr>
                      <tr>
                        <th>Peer Host</th>
                        <td>{selectedDeviceStatus?.peerHost || '-'}</td>
                      </tr>
                      <tr>
                        <th>Peer Port</th>
                        <td>{selectedDeviceStatus?.peerPort || '-'}</td>
                      </tr>
                      <tr>
                        <th>Protocol</th>
                        <td>{selectedDeviceStatus?.protocol || '-'}</td>
                      </tr>
                      <tr>
                        <th>Keep Alive</th>
                        <td>{selectedDeviceStatus?.keepAlive || '-'}</td>
                      </tr>
                      <tr>
                        <th>Session Expiry</th>
                        <td>{selectedDeviceStatus?.sessionExpiryInterval || '-'}</td>
                      </tr>
                      <tr>
                        <th>Connected At</th>
                        <td>{selectedDeviceStatus?.connectedAt || '-'}</td>
                      </tr>
                      <tr>
                        <th>Disconnected At</th>
                        <td>{selectedDeviceStatus?.disconnectedAt || '-'}</td>
                      </tr>
                      <tr>
                        <th>Reason</th>
                        <td>{selectedDeviceStatus?.reason || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <div className="dashboard-cli-grid">
              <section className="dashboard-cli-card">
                <header>
                  <h4>Publish Command</h4>
                  <p>
                    Permission source:{' '}
                    {publishAllowed.length > 0 ? 'publish/readwrite rule found' : 'fallback topic (no publish rule)'}
                  </p>
                </header>
                <code className="dashboard-cli-block">{publishCommand}</code>
                <button
                  type="button"
                  className="dashboard-secondary-button"
                  onClick={() => copyText('publish', publishCommand)}
                >
                  {copiedKey === 'publish' ? 'Copied' : 'Copy Publish Command'}
                </button>
              </section>

              <section className="dashboard-cli-card">
                <header>
                  <h4>Subscribe Command</h4>
                  <p>
                    Permission source:{' '}
                    {subscribeAllowed.length > 0
                      ? 'subscribe/readwrite rule found'
                      : 'fallback topic (no subscribe rule)'}
                  </p>
                </header>
                <code className="dashboard-cli-block">{subscribeCommand}</code>
                <button
                  type="button"
                  className="dashboard-secondary-button"
                  onClick={() => copyText('subscribe', subscribeCommand)}
                >
                  {copiedKey === 'subscribe' ? 'Copied' : 'Copy Subscribe Command'}
                </button>
              </section>
            </div>

            <section className="dashboard-rules-section">
              <h4>Usage Tracking (Last 24 Hours)</h4>
              {isLoadingUsage ? (
                <p className="dashboard-muted">Loading usage stats...</p>
              ) : !selectedDeviceUsageSummary ? (
                <p className="dashboard-muted">No usage data received yet.</p>
              ) : (
                <div className="dashboard-usage-layout">
                  <div className="dashboard-usage-summary-grid">
                    <article className="dashboard-usage-stat">
                      <span>Total Transfer</span>
                      <strong>{formatBytes(totalEstimatedBytes)}</strong>
                      <small>{formatBytes(totalPayloadBytes)} payload only</small>
                    </article>
                    <article className="dashboard-usage-stat">
                      <span>Total Messages</span>
                      <strong>{formatCount(totalMessages)}</strong>
                      <small>{formatCount(inboundMessages)} in / {formatCount(outboundMessages)} out</small>
                    </article>
                    <article className="dashboard-usage-stat">
                      <span>Inbound Traffic</span>
                      <strong>{formatBytes(inboundEstimatedBytes)}</strong>
                      <small>{inboundPercent}% of total transfer</small>
                    </article>
                    <article className="dashboard-usage-stat">
                      <span>Top Topic</span>
                      <strong className="dashboard-usage-compact">{busiestTopic}</strong>
                      <small>
                        {busiestBucket ? formatBytes(busiestBucket.estimatedTotalBytes ?? 0) : 'No bucket data'}
                      </small>
                    </article>
                  </div>

                  <div className="dashboard-usage-traffic-grid">
                    <section className="dashboard-usage-panel">
                      <header>
                        <h5>Traffic Split</h5>
                        <p>Estimated MQTT transfer including lightweight protocol overhead.</p>
                      </header>

                      <div className="dashboard-usage-bar-stack">
                        <div className="dashboard-usage-bar-track">
                          <div className="dashboard-usage-bar dashboard-usage-bar-inbound" style={{ width: `${inboundPercent}%` }} />
                          <div className="dashboard-usage-bar dashboard-usage-bar-outbound" style={{ width: `${outboundPercent}%` }} />
                        </div>
                        <div className="dashboard-usage-legend">
                          <div>
                            <span className="dashboard-usage-dot dashboard-usage-dot-inbound" />
                            <strong>Inbound</strong>
                            <small>{formatBytes(inboundEstimatedBytes)} / {formatCount(inboundMessages)} msgs</small>
                          </div>
                          <div>
                            <span className="dashboard-usage-dot dashboard-usage-dot-outbound" />
                            <strong>Outbound</strong>
                            <small>{formatBytes(outboundEstimatedBytes)} / {formatCount(outboundMessages)} msgs</small>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="dashboard-usage-panel">
                      <header>
                        <h5>Payload vs Transfer</h5>
                        <p>Useful for seeing how much of the traffic is actual message body.</p>
                      </header>

                      <div className="dashboard-usage-kpis">
                        <div>
                          <span>Payload Bytes</span>
                          <strong>{formatBytes(totalPayloadBytes)}</strong>
                        </div>
                        <div>
                          <span>Estimated Overhead</span>
                          <strong>{formatBytes(Math.max(totalEstimatedBytes - totalPayloadBytes, 0))}</strong>
                        </div>
                        <div>
                          <span>Activity Window</span>
                          <strong>24 hours</strong>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </section>

            <section className="dashboard-rules-section">
              <h4>Recent Usage Activity</h4>
              {isLoadingUsage ? (
                <p className="dashboard-muted">Loading usage buckets...</p>
              ) : selectedDeviceUsageBuckets.length === 0 ? (
                <p className="dashboard-muted">No usage bucket records yet.</p>
              ) : (
                <div className="dashboard-usage-activity-list">
                  {recentUsageBuckets.map((bucket, index) => {
                    const bucketPercent = totalEstimatedBytes > 0
                      ? Math.max(8, Math.round(((bucket.estimatedTotalBytes ?? 0) / totalEstimatedBytes) * 100))
                      : 8

                    return (
                      <article
                        key={`${bucket.bucketStart}-${bucket.direction}-${bucket.topic}-${index}`}
                        className="dashboard-usage-activity-item"
                      >
                        <div className="dashboard-usage-activity-head">
                          <div>
                            <strong>{formatBucketTime(bucket.bucketStart)}</strong>
                            <span>{bucket.direction === 'OUTBOUND' ? 'Outbound delivery' : 'Inbound publish'}</span>
                          </div>
                          <span className="dashboard-details-badge">{formatBytes(bucket.estimatedTotalBytes ?? 0)}</span>
                        </div>

                        <p className="dashboard-usage-topic">{bucket.topic || '-'}</p>

                        <div className="dashboard-usage-activity-bar">
                          <div
                            className={
                              bucket.direction === 'OUTBOUND'
                                ? 'dashboard-usage-bar dashboard-usage-bar-outbound'
                                : 'dashboard-usage-bar dashboard-usage-bar-inbound'
                            }
                            style={{ width: `${Math.min(bucketPercent, 100)}%` }}
                          />
                        </div>

                        <div className="dashboard-usage-activity-meta">
                          <span>{formatCount(bucket.messageCount ?? 0)} messages</span>
                          <span>{formatBytes(bucket.payloadBytes ?? 0)} payload</span>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="dashboard-rules-section">
              <h4>Device ACL Rules</h4>
              {isLoadingRules ? (
                <p className="dashboard-muted">Loading rules...</p>
              ) : selectedDeviceRules.length === 0 ? (
                <p className="dashboard-muted">No ACL rules found for this device.</p>
              ) : (
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Permission</th>
                        <th>Topic</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDeviceRules.map((rule) => (
                        <tr key={rule.id}>
                          <td>{rule.id}</td>
                          <td>{rule.permission}</td>
                          <td className="dashboard-truncate">{rule.topic}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </article>
    </section>
  )
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

function formatBucketTime(value) {
  if (!value) {
    return 'Unknown time'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
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
