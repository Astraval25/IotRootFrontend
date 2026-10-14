import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchStoredMessages } from '../api/storedDataApi'
import { useWorkspace } from '../realtime/useWorkspace'
import { analyzeStoredMessages, buildTopicDataQuery, filterMessagesForTopic } from '../storedDataAnalysis'

function NumberChart({ series }) {
  const width = 640
  const height = 170
  const padding = 24
  const values = series.points.map(point => point.value)
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const range = maximum - minimum || 1
  const coordinates = series.points.map((point, index) => ({
    x: series.points.length === 1 ? width / 2 : padding + (index / (series.points.length - 1)) * (width - padding * 2),
    y: height - padding - ((point.value - minimum) / range) * (height - padding * 2),
  }))
  const points = coordinates.map(point => `${point.x},${point.y}`).join(' ')
  const latest = series.points.at(-1)?.value

  return <article className="rounded border border-slate-200 bg-white p-4">
    <header className="mb-3 flex items-start justify-between gap-4"><div><h3 className="m-0 font-mono text-sm font-semibold text-[#1d2f6f]">{series.path}</h3><p className="mt-1 text-xs text-slate-500">{series.points.length} numeric sample{series.points.length === 1 ? '' : 's'}</p></div><strong className="text-xl text-slate-900">{latest}</strong></header>
    <svg className="h-[170px] w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`${series.path} values over the last hour`}>
      <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="#cbd5e1" />
      <line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke="#cbd5e1" />
      {points && <polyline points={points} fill="none" stroke="#1d2f6f" strokeWidth="3" vectorEffect="non-scaling-stroke" />}
      {series.points.map((point, index) => <circle key={`${point.receivedAt}-${index}`} cx={coordinates[index].x} cy={coordinates[index].y} r="4" fill="#8390fa"><title>{`${point.value} at ${new Date(point.receivedAt).toLocaleString()}`}</title></circle>)}
      <text x={padding + 4} y={padding - 6} fontSize="12" fill="#64748b">{maximum}</text>
      <text x={padding + 4} y={height - 7} fontSize="12" fill="#64748b">{minimum}</text>
    </svg>
  </article>
}

function GroupedValues({ group }) {
  const maximum = Math.max(...group.values.map(value => value.count), 1)
  return <article className="rounded border border-slate-200 bg-white p-4">
    <h3 className="m-0 font-mono text-sm font-semibold text-[#1d2f6f]">{group.path}</h3>
    <div className="mt-4 grid gap-2">{group.values.slice(0, 8).map(item => <div className="grid grid-cols-[minmax(80px,auto)_1fr_auto] items-center gap-3 text-xs" key={item.value}><span className="max-w-40 truncate" title={item.value}>{item.value}</span><span className="h-2 overflow-hidden rounded bg-slate-100"><span className="block h-full rounded bg-[#8390fa]" style={{ width: `${(item.count / maximum) * 100}%` }} /></span><strong>{item.count}</strong></div>)}</div>
  </article>
}

export function DashboardTopicDataPage() {
  const { deviceId, topicId } = useParams()
  const { devices, topics, topicsLoading, topicsError, store } = useWorkspace()
  const [messages, setMessages] = useState([])
  const [range, setRange] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const device = devices?.find(item => String(item.id) === deviceId)
  const topic = topics?.find(item => String(item.id) === topicId && String(item.deviceId) === deviceId)

  useEffect(() => { store.loadTopics() }, [store])

  useEffect(() => {
    if (!topic) return undefined
    let active = true
    const load = () => fetchStoredMessages({ deviceId, ...buildTopicDataQuery(topic.topic), size: 200 })
      .then(response => {
        if (!active) return
        setMessages(filterMessagesForTopic(response.data?.content ?? [], topic.topic))
        setRange(response.data ? { from: response.data.from, to: response.data.to } : null)
        setError('')
      })
      .catch(err => { if (active) setError(err.message || 'Could not load topic data.') })
      .finally(() => { if (active) setLoading(false) })
    load()
    const refreshTimer = window.setInterval(load, 10_000)
    return () => { active = false; window.clearInterval(refreshTimer) }
  }, [deviceId, topic])

  const analysis = useMemo(() => analyzeStoredMessages(messages), [messages])
  const latest = messages[0]

  if (topics === null || topicsLoading) return <p className="p-6 text-sm text-slate-500">Loading topic data…</p>
  if (!device || !topic) return <section className="grid gap-4 p-6"><Link className="text-sm font-semibold text-[#1d2f6f]" to={`/iotroot/dashboard/devices/${deviceId}/topics`}>← Back to topics</Link><p className="border border-slate-300 bg-white p-10 text-center text-sm text-slate-500">{topicsError || 'Topic not found.'}</p></section>

  return <section className="grid min-h-full content-start gap-6 bg-[#f2f3f3] p-6 max-sm:p-4">
    <header><Link className="text-sm font-semibold text-[#1d2f6f]" to={`/iotroot/dashboard/devices/${deviceId}/topics`}>← {device.username} topics</Link><div className="mt-3 flex flex-wrap items-start justify-between gap-4"><div><h1 className="m-0 text-2xl font-semibold text-[#1d2f6f]">Topic data</h1><p className="mt-2 break-all font-mono text-sm text-slate-600">{topic.topic}</p></div><span className="rounded bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Refreshes every 10 seconds</span></div></header>
    {error && <p className="m-0 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <article className="border border-[#d5dbdb] bg-white shadow-sm"><header className="border-b border-slate-200 px-5 py-4"><h2 className="m-0 text-base font-semibold">Latest message</h2><p className="mt-1 text-xs text-slate-500">Most recent stored JSON message within the last-hour window.</p></header>{latest ? <div className="grid grid-cols-[minmax(180px,.5fr)_minmax(0,1.5fr)] gap-5 p-5 max-[760px]:grid-cols-1"><dl className="grid content-start gap-3 text-xs"><div><dt className="text-slate-500">Received</dt><dd className="mt-1 font-semibold">{new Date(latest.receivedAt).toLocaleString()}</dd></div><div><dt className="text-slate-500">Actual topic</dt><dd className="mt-1 break-all font-mono">{latest.topic}</dd></div><div><dt className="text-slate-500">Payload size</dt><dd className="mt-1 font-semibold">{latest.payloadBytes} bytes</dd></div></dl><pre className="m-0 max-h-80 overflow-auto rounded bg-[#17265b] p-4 text-xs leading-6 text-white"><code>{JSON.stringify(latest.payload, null, 2)}</code></pre></div> : <p className="m-0 p-10 text-center text-sm text-slate-500">{loading ? 'Loading messages…' : 'No stored message was received for this topic during the last hour.'}</p>}</article>
    <section><div className="mb-4"><h2 className="m-0 text-lg font-semibold">Last-hour analysis</h2><p className="mt-1 text-xs text-slate-500">{messages.length} matching message{messages.length === 1 ? '' : 's'}{range ? ` · ${new Date(range.from).toLocaleTimeString()} to ${new Date(range.to).toLocaleTimeString()}` : ''}</p></div>
      {analysis.numericSeries.length > 0 && <div className="grid grid-cols-2 gap-4 max-[1000px]:grid-cols-1">{analysis.numericSeries.slice(0, 8).map(series => <NumberChart series={series} key={series.path} />)}</div>}
      {analysis.groupedValues.length > 0 && <div className="mt-4 grid grid-cols-2 gap-4 max-[1000px]:grid-cols-1">{analysis.groupedValues.slice(0, 8).map(group => <GroupedValues group={group} key={group.path} />)}</div>}
      {!loading && messages.length > 0 && analysis.numericSeries.length === 0 && analysis.groupedValues.length === 0 && <p className="border border-slate-300 bg-white p-6 text-sm text-slate-500">The payloads contain no chartable numeric, text, or boolean fields.</p>}
    </section>
    {messages.length > 0 && <article className="overflow-hidden border border-[#d5dbdb] bg-white shadow-sm"><header className="border-b border-slate-200 px-5 py-4"><h2 className="m-0 text-base font-semibold">Recent messages</h2><p className="mt-1 text-xs text-slate-500">Newest first · up to 200 messages from the last hour.</p></header><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead><tr className="bg-[#eef0ff] uppercase tracking-wide text-[#1d2f6f]"><th className="px-5 py-3">Received</th><th className="px-5 py-3">Actual topic</th><th className="px-5 py-3">Payload</th></tr></thead><tbody>{messages.map(message => <tr className="border-t border-slate-200 align-top" key={message.id}><td className="whitespace-nowrap px-5 py-3 text-slate-500">{new Date(message.receivedAt).toLocaleString()}</td><td className="max-w-64 break-all px-5 py-3 font-mono text-[#1d2f6f]">{message.topic}</td><td className="px-5 py-3"><code className="block max-w-[520px] break-all whitespace-pre-wrap">{JSON.stringify(message.payload)}</code></td></tr>)}</tbody></table></div></article>}
    {analysis.structure.length > 0 && <article className="border border-[#d5dbdb] bg-white p-5 shadow-sm"><h2 className="m-0 text-base font-semibold">Latest payload structure</h2><div className="mt-4 flex flex-wrap gap-2">{analysis.structure.map(field => <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs" key={`${field.path}-${field.type}`}>{field.path} <strong className="text-[#8390fa]">{field.type}</strong></span>)}</div></article>}
  </section>
}
