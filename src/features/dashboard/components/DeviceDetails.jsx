import { useEffect, useState } from 'react'
import { useWorkspace } from '../realtime/useWorkspace'

export function DeviceDetails({ device: selectedDevice }) {
  const { deviceStatuses, usageByDevice, store } = useWorkspace()
  const selectedDeviceId = String(selectedDevice.id)
  const usage = usageByDevice[selectedDeviceId]
  const selectedDeviceUsageSummary = usage?.summary
  const selectedDeviceUsageBuckets = usage?.buckets ?? []
  const isLoadingUsage = !usage || usage.loading
  const [copiedKey, setCopiedKey] = useState('')
  const [copyError, setCopyError] = useState('')
  useEffect(() => { store.loadUsage(selectedDeviceId) }, [store, selectedDeviceId])
  async function copyText(key, text) {
    try { await navigator.clipboard.writeText(text); setCopiedKey(key); setCopyError('') }
    catch { setCopyError('Could not copy. Select and copy the text instead.') }
  }
  const selectedDeviceStatus = selectedDeviceId ? deviceStatuses[String(selectedDeviceId)] : null
  const username = selectedDevice.username
  const inboundPayloadBytes = selectedDeviceUsageSummary?.inboundPayloadBytes ?? 0
  const outboundPayloadBytes = selectedDeviceUsageSummary?.outboundPayloadBytes ?? 0
  const inboundEstimatedBytes = selectedDeviceUsageSummary?.inboundEstimatedTotalBytes ?? 0
  const outboundEstimatedBytes = selectedDeviceUsageSummary?.outboundEstimatedTotalBytes ?? 0
  const inboundMessages = selectedDeviceUsageSummary?.inboundMessages ?? 0
  const outboundMessages = selectedDeviceUsageSummary?.outboundMessages ?? 0
  const totalPayloadBytes = inboundPayloadBytes + outboundPayloadBytes
  const totalEstimatedBytes = inboundEstimatedBytes + outboundEstimatedBytes
  const overheadBytes = Math.max(totalEstimatedBytes - totalPayloadBytes, 0)
  const totalMessages = inboundMessages + outboundMessages
  const inboundPercent = totalEstimatedBytes > 0 ? Math.round((inboundEstimatedBytes / totalEstimatedBytes) * 100) : 0
  const outboundPercent = totalEstimatedBytes > 0 ? 100 - inboundPercent : 0
  const recentUsageBuckets = selectedDeviceUsageBuckets.slice(-8)
  const maxRecentUsageBytes = Math.max(...recentUsageBuckets.map(bucket => bucket.estimatedTotalBytes ?? 0), 1)
  const chartPoints = recentUsageBuckets.map((bucket, index) => ({
    bucket,
    x: recentUsageBuckets.length === 1 ? 50 : (index / (recentUsageBuckets.length - 1)) * 100,
    y: 90 - ((bucket.estimatedTotalBytes ?? 0) / maxRecentUsageBytes) * 78,
  }))
  const linePoints = chartPoints.map(point => `${point.x},${point.y}`).join(' ')
  const payloadPercent = totalEstimatedBytes > 0 ? Math.round((totalPayloadBytes / totalEstimatedBytes) * 100) : 0
  const overheadPercent = totalEstimatedBytes > 0 ? 100 - payloadPercent : 0
  const busiestBucket = selectedDeviceUsageBuckets.reduce((largest, bucket) => {
    if (!largest || (bucket.estimatedTotalBytes ?? 0) > (largest.estimatedTotalBytes ?? 0)) {
      return bucket
    }
    return largest
  }, null)
  const busiestTopic = busiestBucket?.topic || 'No traffic yet'

  return (<div className="grid gap-5 [&_.dashboard-card]:border [&_.dashboard-card]:border-slate-300 [&_.dashboard-card]:bg-white [&_.dashboard-card]:p-6 [&_.dashboard-details-header]:border-b [&_.dashboard-details-header]:border-slate-200 [&_.dashboard-details-header]:pb-5 [&_.dashboard-details-grid]:grid [&_.dashboard-details-grid]:grid-cols-3 [&_.dashboard-details-grid]:gap-4 max-[760px]:[&_.dashboard-details-grid]:grid-cols-1 [&_.dashboard-detail-item]:grid [&_.dashboard-detail-item]:gap-1 [&_.dashboard-detail-item]:rounded [&_.dashboard-detail-item]:border [&_.dashboard-detail-item]:border-slate-200 [&_.dashboard-detail-item]:bg-[#f7f8fc] [&_.dashboard-detail-item]:p-4 [&_.dashboard-muted]:text-sm [&_.dashboard-muted]:text-slate-500 [&_.dashboard-rules-section]:mt-6 [&_.dashboard-rules-section]:border-t [&_.dashboard-rules-section]:border-slate-200 [&_.dashboard-rules-section]:pt-6 [&_.dashboard-usage-summary-grid]:grid [&_.dashboard-usage-summary-grid]:grid-cols-4 [&_.dashboard-usage-summary-grid]:gap-3 max-[900px]:[&_.dashboard-usage-summary-grid]:grid-cols-2 [&_.dashboard-usage-stat]:grid [&_.dashboard-usage-stat]:gap-1 [&_.dashboard-usage-stat]:rounded [&_.dashboard-usage-stat]:border [&_.dashboard-usage-stat]:border-slate-200 [&_.dashboard-usage-stat]:p-4 [&_.dashboard-usage-traffic-grid]:grid [&_.dashboard-usage-traffic-grid]:grid-cols-2 [&_.dashboard-usage-traffic-grid]:gap-4 max-[900px]:[&_.dashboard-usage-traffic-grid]:grid-cols-1 [&_.dashboard-usage-panel]:rounded [&_.dashboard-usage-panel]:border [&_.dashboard-usage-panel]:border-slate-200 [&_.dashboard-usage-panel]:p-4">
    {copyError && <p role="alert" className="dashboard-message dashboard-message-error">{copyError}</p>}
    {usage?.error && <p role="alert" className="dashboard-message dashboard-message-error">{usage.error} <button className="dashboard-secondary-button" onClick={() => store.loadUsage(selectedDeviceId)}>Retry</button></p>}
      <article className="dashboard-card dashboard-details-card">
        <header className="dashboard-details-header">
          <div>
            <p>Device-specific identity, session, and usage.</p>
          </div>
        </header>

        {!selectedDevice ? (
          <p className="dashboard-muted">Select a device from the inventory to manage rules and generate commands.</p>
        ) : (
          <>         

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
                      </header>

                      <div className="mt-5 flex flex-wrap items-center justify-center gap-8">
                        <div className="relative grid size-44 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#1d2f6f 0 ${inboundPercent}%, #8390fa ${inboundPercent}% 100%)` }} role="img" aria-label={`Inbound ${inboundPercent} percent, outbound ${outboundPercent} percent`}>
                          <div className="grid size-28 place-items-center rounded-full bg-white text-center shadow-inner">
                            <div><strong className="block text-xl text-[#1d2f6f]">{formatBytes(totalEstimatedBytes)}</strong><small className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total traffic</small></div>
                          </div>
                        </div>
                        <div className="grid min-w-[190px] gap-4 text-sm">
                          <div className="grid grid-cols-[10px_1fr_auto] items-center gap-2"><span className="size-2.5 rounded-full bg-[#1d2f6f]" /><div><strong className="block">Inbound</strong><small className="text-slate-500">{formatCount(inboundMessages)} messages</small></div><strong>{inboundPercent}%</strong></div>
                          <div className="grid grid-cols-[10px_1fr_auto] items-center gap-2"><span className="size-2.5 rounded-full bg-[#8390fa]" /><div><strong className="block">Outbound</strong><small className="text-slate-500">{formatCount(outboundMessages)} messages</small></div><strong>{outboundPercent}%</strong></div>
                        </div>
                      </div>
                    </section>

                    <section className="dashboard-usage-panel">
                      <header>
                        <h5>Payload vs Transfer</h5>
                      </header>

                      <div className="mt-6 grid grid-cols-2 items-end gap-6">
                        <div className="grid justify-items-center gap-2">
                          <strong className="text-sm">{formatBytes(totalPayloadBytes)}</strong>
                          <div className="flex h-40 w-16 items-end overflow-hidden rounded-t bg-[#eef0ff]"><div className="w-full bg-[#1d2f6f] transition-[height]" style={{ height: `${Math.max(payloadPercent, 4)}%` }} /></div>
                          <span className="text-xs font-semibold text-slate-600">Payload</span>
                          <small className="text-[10px] text-slate-500">{payloadPercent}% of transfer</small>
                        </div>
                        <div className="grid justify-items-center gap-2">
                          <strong className="text-sm">{formatBytes(overheadBytes)}</strong>
                          <div className="flex h-40 w-16 items-end overflow-hidden rounded-t bg-[#fff8d9]"><div className="w-full bg-[#fac748] transition-[height]" style={{ height: `${Math.max(overheadPercent, 4)}%` }} /></div>
                          <span className="text-xs font-semibold text-slate-600">Protocol overhead</span>
                          <small className="text-[10px] text-slate-500">{overheadPercent}% of transfer</small>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </section>

            <section className="dashboard-rules-section">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div><h4>Recent usage activity</h4></div>
                <div className="flex gap-4 text-[11px] text-slate-500"><span className="flex items-center gap-1.5"><i className="size-2.5 bg-[#1d2f6f]" />Inbound</span><span className="flex items-center gap-1.5"><i className="size-2.5 bg-[#8390fa]" />Outbound</span></div>
              </div>
              {isLoadingUsage ? (
                <p className="dashboard-muted">Loading usage buckets...</p>
              ) : selectedDeviceUsageBuckets.length === 0 ? (
                <p className="dashboard-muted">No usage bucket records yet.</p>
              ) : (
                <div className="grid min-h-[290px] grid-cols-[28px_1fr] overflow-x-auto border border-slate-300 bg-white p-4" role="img" aria-label="Recent MQTT transfer activity line chart">
                  <div className="self-center -rotate-90 text-[10px] font-bold uppercase text-slate-500">Transfer</div>
                  <div className="relative min-w-[600px] pb-10 pt-3">
                    <div className="absolute inset-x-0 bottom-10 top-3 flex flex-col justify-between [&_i]:border-t [&_i]:border-dashed [&_i]:border-slate-200" aria-hidden="true"><i /><i /><i /><i /><i /></div>
                    <svg className="relative z-[1] h-[210px] w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                      <defs><linearGradient id="usageArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8390fa" stopOpacity=".28" /><stop offset="100%" stopColor="#8390fa" stopOpacity=".02" /></linearGradient></defs>
                      <polygon points={`0,100 ${linePoints} 100,100`} fill="url(#usageArea)" />
                      <polyline points={linePoints} fill="none" stroke="#1d2f6f" strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
                      {chartPoints.map(({ bucket, x, y }, index) => <circle key={`${bucket.bucketStart}-${index}`} cx={x} cy={y} r="1.7" fill={bucket.direction === 'OUTBOUND' ? '#8390fa' : '#1d2f6f'} stroke="#fff" strokeWidth=".7"><title>{formatBucketTime(bucket.bucketStart)}: {formatBytes(bucket.estimatedTotalBytes ?? 0)}</title></circle>)}
                    </svg>
                    <div className="absolute inset-x-0 bottom-0 flex justify-between">
                      {chartPoints.map(({ bucket }, index) => <div className="grid justify-items-center text-[10px]" key={`label-${bucket.bucketStart}-${index}`}><strong>{formatChartTime(bucket.bucketStart)}</strong><small className="text-slate-500">{formatCount(bucket.messageCount ?? 0)} msg</small></div>)}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </article>
  </div>)
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

function formatChartTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date)
}

