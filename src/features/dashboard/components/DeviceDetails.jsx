import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../../../shared/config/env'
import { getCurrentUserId } from '../../auth/session/authSession'
import { useWorkspace } from '../realtime/useWorkspace'

export function DeviceDetails({ device: selectedDevice }) {
  const { deviceStatuses, usageByDevice, topics, store } = useWorkspace()
  const selectedDeviceId = String(selectedDevice.id)
  const usage = usageByDevice[selectedDeviceId]
  const selectedDeviceUsageSummary = usage?.summary
  const selectedDeviceUsageBuckets = usage?.buckets ?? []
  const selectedDeviceRules = (topics ?? []).filter(rule => String(rule.deviceId) === selectedDeviceId)
  const isLoadingUsage = !usage || usage.loading
  const isLoadingStatus = false
  const [copiedKey, setCopiedKey] = useState('')
  const [copyError, setCopyError] = useState('')
  useEffect(() => { store.loadUsage(selectedDeviceId); store.loadTopics() }, [store, selectedDeviceId])
  async function copyText(key, text) {
    try { await navigator.clipboard.writeText(text); setCopiedKey(key); setCopyError('') }
    catch { setCopyError('Could not copy. Select and copy the text instead.') }
  }
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
    selectedDeviceRules[0]?.topic || `/iot/${getCurrentUserId() || 'userId'}/sample/topic`
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

  return (<>
    {copyError && <p role="alert" className="dashboard-message dashboard-message-error">{copyError}</p>}
    {usage?.error && <p role="alert" className="dashboard-message dashboard-message-error">{usage.error} <button className="dashboard-secondary-button" onClick={() => store.loadUsage(selectedDeviceId)}>Retry</button></p>}
      <article className="dashboard-card dashboard-details-card">
        <header className="dashboard-details-header">
          <div>
            <h3>Connection Details</h3>
            <p>MQTT connection and usage.</p>
          </div>
          <span className="dashboard-details-badge">{selectedDevice ? `Device #${selectedDevice.id}` : 'No device'}</span>
        </header>

        {!selectedDevice ? (
          <p className="dashboard-muted">Select a device from the inventory to manage rules and generate commands.</p>
        ) : (
          <>
            <div className="dashboard-details-grid">
              <div className="dashboard-detail-item">
                <span>URL</span>
                <strong>{brokerUrl}</strong>
                <button type="button" className="dashboard-inline-action" onClick={() => copyText('url', brokerUrl)}>
                  {copiedKey === 'url' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="dashboard-detail-item">
                <span>Connection</span>
                <strong>{selectedDeviceStatus ? selectedDeviceStatus.connected ? 'Connected' : 'Disconnected' : 'Unknown'}</strong>
              </div>
              <div className="dashboard-detail-item">
                <span>Host</span>
                <strong>{brokerHost}</strong>
                <button type="button" className="dashboard-inline-action" onClick={() => copyText('host', brokerHost)}>
                  {copiedKey === 'host' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="dashboard-detail-item">
                <span>Port</span>
                <strong>{brokerPort}</strong>
                <button type="button" className="dashboard-inline-action" onClick={() => copyText('port', brokerPort)}>
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
              <h4>Session</h4>
              {isLoadingStatus ? (
                <p className="dashboard-muted">Refreshing session status...</p>
              ) : (
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <tbody>
                      <tr><th>Status Source</th><td>{selectedDeviceStatus?.statusSource || '-'}</td></tr>
                      <tr><th>Node</th><td>{selectedDeviceStatus?.node || '-'}</td></tr>
                      <tr><th>Peer Host</th><td>{selectedDeviceStatus?.peerHost || '-'}</td></tr>
                      <tr><th>Peer Port</th><td>{selectedDeviceStatus?.peerPort || '-'}</td></tr>
                      <tr><th>Protocol</th><td>{selectedDeviceStatus?.protocol || '-'}</td></tr>
                      <tr><th>Keep Alive</th><td>{selectedDeviceStatus?.keepAlive || '-'}</td></tr>
                      <tr><th>Session Expiry</th><td>{selectedDeviceStatus?.sessionExpiryInterval || '-'}</td></tr>
                      <tr><th>Connected At</th><td>{selectedDeviceStatus?.connectedAt || '-'}</td></tr>
                      <tr><th>Disconnected At</th><td>{selectedDeviceStatus?.disconnectedAt || '-'}</td></tr>
                      <tr><th>Reason</th><td>{selectedDeviceStatus?.reason || '-'}</td></tr>
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <Link className="dashboard-secondary-button dashboard-link-button" to={`/iotroot/dashboard/topics?device=${selectedDevice.id}`}>View topics</Link>

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
                <button type="button" className="dashboard-secondary-button" onClick={() => copyText('publish', publishCommand)}>
                  {copiedKey === 'publish' ? 'Copied' : 'Copy Publish Command'}
                </button>
              </section>

              <section className="dashboard-cli-card">
                <header>
                  <h4>Subscribe Command</h4>
                  <p>
                    Permission source:{' '}
                    {subscribeAllowed.length > 0 ? 'subscribe/readwrite rule found' : 'fallback topic (no subscribe rule)'}
                  </p>
                </header>
                <code className="dashboard-cli-block">{subscribeCommand}</code>
                <button type="button" className="dashboard-secondary-button" onClick={() => copyText('subscribe', subscribeCommand)}>
                  {copiedKey === 'subscribe' ? 'Copied' : 'Copy Subscribe Command'}
                </button>
              </section>
            </div>

            <section className="dashboard-rules-section">
              <h4>Usage · Last 24 hours</h4>
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
                      <small>{busiestBucket ? formatBytes(busiestBucket.estimatedTotalBytes ?? 0) : 'No bucket data'}</small>
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
                        <div><span>Payload Bytes</span><strong>{formatBytes(totalPayloadBytes)}</strong></div>
                        <div><span>Estimated Overhead</span><strong>{formatBytes(Math.max(totalEstimatedBytes - totalPayloadBytes, 0))}</strong></div>
                        <div><span>Activity Window</span><strong>24 hours</strong></div>
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
          </>
        )}
      </article>
  </>)
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

