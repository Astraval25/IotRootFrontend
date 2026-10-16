import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchAccountUsageOverview } from '../api/deviceApi'

function formatBytes(value) {
  const bytes = Number(value ?? 0)
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let amount = bytes
  let unit = -1
  do { amount /= 1024; unit += 1 } while (amount >= 1024 && unit < units.length - 1)
  return `${amount.toFixed(amount >= 10 ? 1 : 2)} ${units[unit]}`
}

function formatCount(value) {
  return Number(value ?? 0).toLocaleString()
}

function MetricCard({ label, value, detail, tone = 'indigo' }) {
  const tones = {
    indigo: 'border-[#8390fa] bg-[#eef0ff] text-[#1d2f6f]',
    amber: 'border-[#fac748] bg-amber-50 text-amber-900',
    emerald: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    slate: 'border-slate-300 bg-white text-slate-900',
  }
  return <article className={`border-t-4 p-5 shadow-sm ${tones[tone]}`}><p className="m-0 text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p><strong className="mt-2 block text-2xl">{value}</strong><p className="mt-1 text-xs opacity-70">{detail}</p></article>
}

function UsageBar({ label, value, maximum, color, detail }) {
  const width = maximum > 0 ? Math.max((value / maximum) * 100, value > 0 ? 1 : 0) : 0
  return <div className="grid gap-2"><div className="flex items-center justify-between gap-4 text-sm"><span className="font-semibold">{label}</span><span>{formatBytes(value)}</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><span className={`block h-full rounded-full ${color}`} style={{ width: `${width}%` }} /></div><p className="m-0 text-xs text-slate-500">{detail}</p></div>
}

export function DashboardUsagePage() {
  const [usage, setUsage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestId = useRef(0)

  const refresh = useCallback(() => {
    const currentRequest = ++requestId.current
    setLoading(true)
    fetchAccountUsageOverview()
      .then(response => {
        if (currentRequest === requestId.current) {
          setUsage(response.data)
          setError('')
        }
      })
      .catch(err => {
        if (currentRequest === requestId.current) setError(err.message || 'Could not load usage totals.')
      })
      .finally(() => {
        if (currentRequest === requestId.current) setLoading(false)
      })
  }, [])

  useEffect(() => {
    const currentRequest = ++requestId.current
    fetchAccountUsageOverview()
      .then(response => {
        if (currentRequest === requestId.current) {
          setUsage(response.data)
          setError('')
        }
      })
      .catch(err => {
        if (currentRequest === requestId.current) setError(err.message || 'Could not load usage totals.')
      })
      .finally(() => {
        if (currentRequest === requestId.current) setLoading(false)
      })
    return () => { requestId.current += 1 }
  }, [])

  const inbound = Number(usage?.inboundEstimatedTotalBytes ?? 0)
  const outbound = Number(usage?.outboundEstimatedTotalBytes ?? 0)
  const stored = Number(usage?.storedPayloadBytes ?? 0)
  const maximum = Math.max(inbound, outbound, stored, 1)
  const totalTraffic = inbound + outbound
  const transactions = Number(usage?.totalTransactions ?? ((usage?.inboundMessages ?? 0) + (usage?.outboundMessages ?? 0)))
  const successfulHttps = Number(usage?.successfulHttpsRequests ?? 0)
  const failedHttps = Number(usage?.failedHttpsRequests ?? 0)
  const totalHttps = successfulHttps + failedHttps

  return <section className="grid min-h-full content-start gap-6 bg-[#f2f3f3] p-6 max-sm:p-4">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="m-0 text-2xl font-semibold tracking-tight text-[#1d2f6f]">Usage</h1><p className="mt-1.5 text-[13px] text-slate-500">All recorded account traffic, stored JSON data, transactions, and device totals for billing.</p></div><button type="button" className="rounded bg-[#1d2f6f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8390fa] disabled:cursor-wait disabled:opacity-60" onClick={refresh} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh usage'}</button></header>
    {error && <p className="m-0 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="grid grid-cols-6 gap-4 max-[1200px]:grid-cols-3 max-[800px]:grid-cols-2 max-sm:grid-cols-1">
      <MetricCard label="Devices" value={usage?.deviceCount ?? '—'} detail="Currently created devices" tone="slate" />
      <MetricCard label="Inbound" value={formatBytes(inbound)} detail={`${formatCount(usage?.inboundMessages)} published messages`} />
      <MetricCard label="Outbound" value={formatBytes(outbound)} detail={`${formatCount(usage?.outboundMessages)} delivered messages`} tone="amber" />
      <MetricCard label="Transactions" value={formatCount(transactions)} detail={`${formatCount(usage?.inboundMessages)} inbound + ${formatCount(usage?.outboundMessages)} outbound`} tone="slate" />
      <MetricCard label="Stored JSON" value={formatBytes(stored)} detail={`${formatCount(usage?.storedMessageCount)} stored messages`} tone="emerald" />
      <MetricCard label="HTTPS calls" value={formatCount(totalHttps)} detail={`${formatCount(successfulHttps)} successful · ${formatCount(failedHttps)} failed`} tone={failedHttps ? 'amber' : 'emerald'} />
    </div>
    <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(280px,.6fr)] gap-5 max-[900px]:grid-cols-1">
      <article className="border border-[#d5dbdb] bg-white p-5 shadow-sm"><header className="mb-6"><h2 className="m-0 text-base font-semibold">Usage comparison</h2><p className="mt-1 text-xs text-slate-500">Estimated MQTT traffic includes payload, topic bytes, and protocol overhead. Stored data is JSON payload size.</p></header><div className="grid gap-6"><UsageBar label="Inbound traffic" value={inbound} maximum={maximum} color="bg-[#8390fa]" detail={`${formatBytes(usage?.inboundPayloadBytes)} payload across ${formatCount(usage?.inboundMessages)} publishes`} /><UsageBar label="Outbound traffic" value={outbound} maximum={maximum} color="bg-[#fac748]" detail={`${formatBytes(usage?.outboundPayloadBytes)} payload across ${formatCount(usage?.outboundMessages)} deliveries`} /><UsageBar label="Stored data" value={stored} maximum={maximum} color="bg-emerald-500" detail={`${formatCount(usage?.storedMessageCount)} JSON records persisted`} /></div></article>
      <article className="border border-[#d5dbdb] bg-white p-5 shadow-sm"><h2 className="m-0 text-base font-semibold">Billing totals</h2><dl className="mt-5 grid gap-4 text-sm"><div className="border-b border-slate-200 pb-3"><dt className="text-xs text-slate-500">Network traffic</dt><dd className="mt-1 text-xl font-semibold text-[#1d2f6f]">{formatBytes(totalTraffic)}</dd></div><div className="border-b border-slate-200 pb-3"><dt className="text-xs text-slate-500">MQTT transactions</dt><dd className="mt-1 text-xl font-semibold">{formatCount(transactions)}</dd><dd className="mt-1 text-xs text-slate-500">{formatCount(usage?.inboundMessages)} inbound + {formatCount(usage?.outboundMessages)} outbound</dd></div><div><dt className="text-xs text-slate-500">Usage period</dt><dd className="mt-1 text-xs font-semibold">{usage ? `All recorded usage through ${new Date(usage.to).toLocaleString()}` : loading ? 'Loading…' : 'Unavailable'}</dd></div></dl></article>
    </div>
  </section>
}
