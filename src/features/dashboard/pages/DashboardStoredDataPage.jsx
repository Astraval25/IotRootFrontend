import { useEffect, useState } from 'react'
import { fetchStoredMessages } from '../api/storedDataApi'
import { useWorkspace } from '../realtime/useWorkspace'
import { API_BASE_URL } from '../../../shared/config/env'

const fieldClass = 'min-h-10 rounded border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#8390fa]'

function toIso(localValue) {
  return localValue ? new Date(localValue).toISOString() : ''
}

function formatPayload(payload) {
  return JSON.stringify(payload, null, 2)
}

export function DashboardStoredDataPage() {
  const { devices, topics, store } = useWorkspace()
  const [filters, setFilters] = useState({ deviceId: '', topicPrefix: '', from: '', to: '' })
  const [query, setQuery] = useState({ page: 0 })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { store.loadTopics() }, [store])

  useEffect(() => {
    let active = true
    fetchStoredMessages(query).then(response => {
      if (active) setResult(response.data)
    }).catch(err => {
      if (active) setError(err.message || 'Could not load stored data.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [query])

  function runQuery(nextQuery) {
    setLoading(true)
    setError('')
    setQuery(nextQuery)
  }

  function submit(event) {
    event.preventDefault()
    runQuery({
      deviceId: filters.deviceId,
      topicPrefix: filters.topicPrefix.trim(),
      from: toIso(filters.from),
      to: toIso(filters.to),
      page: 0,
      size: 50,
    })
  }

  function reset() {
    setFilters({ deviceId: '', topicPrefix: '', from: '', to: '' })
    runQuery({ page: 0 })
  }

  const content = result?.content ?? []
  const httpsApis = (topics ?? []).filter(topic => topic.topicType === 'STORE').map(topic => ({
    ...topic,
    device: devices?.find(device => String(device.id) === String(topic.deviceId)),
    endpoint: `${API_BASE_URL}/api/v1/store/messages?deviceId=${topic.deviceId}&topic=${encodeURIComponent(topic.topic)}`,
  }))

  return (
    <section className="grid min-h-full content-start gap-6 bg-[#f2f3f3] p-6 max-sm:p-4">
      <header><h1 className="m-0 text-2xl font-semibold tracking-tight text-[#1d2f6f]">Stored data</h1><p className="mt-1.5 text-[13px] text-slate-500">JSON messages published to your <code>/iot/store/user/…</code> topics. The default view covers the last hour.</p></header>

      <article className="border border-[#d5dbdb] bg-white shadow-sm">
        <header className="border-b border-[#eaeded] px-5 py-4"><h2 className="m-0 text-base font-semibold">HTTPS APIs</h2><p className="mt-1 text-xs text-slate-500">Every stored topic can be read using its HTTPS endpoint and an API key.</p></header>
        <div className="grid gap-3 p-5">
          {httpsApis.map(api => <section className="rounded border border-slate-200 p-4" id={`https-api-${api.id}`} key={`${api.deviceId}-${api.id}`}><div className="flex flex-wrap items-center justify-between gap-2"><div><strong className="text-sm">{api.device?.username ?? `Device #${api.deviceId}`}</strong><code className="ml-3 break-all text-xs text-[#1d2f6f]">{api.topic}</code></div><span className="rounded bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">GET</span></div><pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded bg-[#17265b] p-3 text-xs text-white"><code>{`curl -H "X-API-Key: YOUR_API_KEY" "${api.endpoint}"`}</code></pre></section>)}
          {!httpsApis.length && <p className="m-0 py-5 text-center text-sm text-slate-500">No stored topics are configured yet.</p>}
        </div>
      </article>

      <form className="grid grid-cols-4 items-end gap-4 border border-[#d5dbdb] bg-white p-5 shadow-sm max-[1050px]:grid-cols-2 max-sm:grid-cols-1" onSubmit={submit}>
        <label className="grid gap-2 text-xs font-semibold">Device<select className={fieldClass} value={filters.deviceId} onChange={event => setFilters(current => ({ ...current, deviceId: event.target.value }))}><option value="">All devices</option>{(devices ?? []).map(device => <option value={device.id} key={device.id}>{device.username}</option>)}</select></label>
        <label className="grid gap-2 text-xs font-semibold">Topic prefix<input className={fieldClass} value={filters.topicPrefix} onChange={event => setFilters(current => ({ ...current, topicPrefix: event.target.value }))} placeholder="/iot/store/4/sensors/" /></label>
        <label className="grid gap-2 text-xs font-semibold">From<input className={fieldClass} type="datetime-local" value={filters.from} onChange={event => setFilters(current => ({ ...current, from: event.target.value }))} /></label>
        <label className="grid gap-2 text-xs font-semibold">To<input className={fieldClass} type="datetime-local" value={filters.to} onChange={event => setFilters(current => ({ ...current, to: event.target.value }))} /></label>
        <div className="col-span-full flex justify-end gap-2"><button type="button" className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#1d2f6f]" onClick={reset}>Last hour</button><button className="rounded bg-[#1d2f6f] px-4 py-2 text-sm font-semibold text-white">Apply filters</button></div>
      </form>

      {error && <p className="m-0 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <article className="overflow-hidden border border-[#d5dbdb] bg-white shadow-sm">
        <header className="flex items-center justify-between gap-4 border-b border-[#eaeded] px-5 py-4"><div><h2 className="m-0 text-base font-semibold">Messages</h2>{result && <p className="mt-1 text-xs text-slate-500">{result.totalElements} result{result.totalElements === 1 ? '' : 's'} · {new Date(result.from).toLocaleString()} to {new Date(result.to).toLocaleString()}</p>}</div>{loading && <span className="text-xs text-slate-500">Loading…</span>}</header>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] border-collapse text-left"><thead><tr className="bg-[#eef0ff] text-[11px] uppercase tracking-wide text-[#1d2f6f]"><th className="px-5 py-3">Received</th><th className="px-5 py-3">Device</th><th className="px-5 py-3">Topic</th><th className="px-5 py-3">JSON payload</th><th className="px-5 py-3">Bytes</th></tr></thead><tbody>
          {content.map(message => <tr className="border-t border-slate-200 align-top" key={message.id}><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{new Date(message.receivedAt).toLocaleString()}</td><td className="px-5 py-4 text-xs font-medium">{devices?.find(device => String(device.id) === String(message.deviceId))?.username ?? `#${message.deviceId}`}</td><td className="max-w-[280px] break-all px-5 py-4 font-mono text-xs text-[#1d2f6f]">{message.topic}</td><td className="px-5 py-4"><pre className="m-0 max-h-40 max-w-[420px] overflow-auto whitespace-pre-wrap break-all rounded bg-slate-50 p-2 text-xs">{formatPayload(message.payload)}</pre></td><td className="px-5 py-4 text-xs">{message.payloadBytes}</td></tr>)}
          {!content.length && !loading && <tr><td className="px-5 py-14 text-center text-sm text-slate-500" colSpan="5">No stored JSON messages match this range.</td></tr>}
        </tbody></table></div>
        {result && result.totalPages > 1 && <footer className="flex items-center justify-end gap-3 border-t border-slate-200 px-5 py-3"><button className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-40" disabled={result.page === 0 || loading} onClick={() => runQuery({ ...query, page: result.page - 1 })}>Previous</button><span className="text-xs text-slate-500">Page {result.page + 1} of {result.totalPages}</span><button className="rounded border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-40" disabled={result.page + 1 >= result.totalPages || loading} onClick={() => runQuery({ ...query, page: result.page + 1 })}>Next</button></footer>}
      </article>
    </section>
  )
}
