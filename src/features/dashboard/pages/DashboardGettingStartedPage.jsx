import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import sketchTemplate from '../assets/iotroot-esp32-temperature.ino?raw'
import { API_BASE_URL } from '../../../shared/config/env'
import { buildStarterSketch, isStarterSketchReady } from '../gettingStartedSketch'
import { useWorkspace } from '../realtime/useWorkspace'

const inputClass = 'min-h-11 w-full rounded border border-slate-300 bg-white px-3.5 text-sm outline-none focus:border-[#8390fa] focus:ring-2 focus:ring-[#8390fa]/20'
const primaryButton = 'inline-flex min-h-10 items-center justify-center rounded bg-[#1d2f6f] px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-[#8390fa] disabled:cursor-not-allowed disabled:opacity-40'
const secondaryButton = 'inline-flex min-h-10 items-center justify-center rounded border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#1d2f6f] no-underline hover:bg-[#eef0ff] disabled:cursor-not-allowed disabled:opacity-40'

function StepMarker({ number, active, complete }) {
  return <span className={`grid size-9 shrink-0 place-items-center rounded-full border text-sm font-bold ${complete ? 'border-emerald-600 bg-emerald-600 text-white' : active ? 'border-[#1d2f6f] bg-[#1d2f6f] text-white' : 'border-slate-300 bg-white text-slate-500'}`}>{complete ? '✓' : number}</span>
}

function SetupSummary({ device, topic, host, port }) {
  return <dl className="grid grid-cols-2 gap-x-5 gap-y-4 rounded border border-slate-200 bg-slate-50 p-4 text-xs max-sm:grid-cols-1">
    <div><dt className="text-slate-500">MQTT username</dt><dd className="mt-1 break-all font-mono font-semibold text-slate-800">{device?.username || 'Loading…'}</dd></div>
    <div><dt className="text-slate-500">Client ID</dt><dd className="mt-1 break-all font-mono font-semibold text-slate-800">{device?.clientId || 'Loading…'}</dd></div>
    <div><dt className="text-slate-500">Stored topic</dt><dd className="mt-1 break-all font-mono font-semibold text-slate-800">{topic?.topic || 'Loading…'}</dd></div>
    <div><dt className="text-slate-500">Broker</dt><dd className="mt-1 break-all font-mono font-semibold text-slate-800">{host}:{port}</dd></div>
  </dl>
}

export function DashboardGettingStartedPage() {
  const { devices, deviceStatuses, topics, topicsLoading, topicsError, refreshing, store } = useWorkspace()
  const [activeStep, setActiveStep] = useState(1)
  const [form, setForm] = useState({ ssid: '', wifiPassword: '', accountPassword: '' })
  const [downloaded, setDownloaded] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [board, setBoard] = useState('ESP32')
  const [showCode, setShowCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')

  useEffect(() => { store.loadTopics() }, [store])

  const starterTopic = useMemo(() => {
    const storedTopics = (topics ?? []).filter(topic => topic.topicType === 'STORE' && (topic.permission === 'publish' || topic.permission === 'readwrite'))
    return storedTopics.find(topic => topic.topic.endsWith('/temperature')) ?? storedTopics[0]
  }, [topics])
  const starterDevice = devices?.find(device => String(device.id) === String(starterTopic?.deviceId))
  const connection = starterDevice ? deviceStatuses[String(starterDevice.id)] : null
  const fallbackHost = new URL(API_BASE_URL, 'http://localhost').hostname
  const host = connection?.brokerHost || fallbackHost
  const port = connection?.brokerPort ?? 1883
  const configuration = {
    ssid: form.ssid,
    wifiPassword: form.wifiPassword,
    mqttPassword: form.accountPassword,
    host,
    port,
    username: starterDevice?.username ?? '',
    clientId: starterDevice?.clientId ?? '',
    topic: starterTopic?.topic ?? '',
  }
  const generatedSketch = buildStarterSketch(sketchTemplate, configuration)
  const ready = isStarterSketchReady(configuration)
  const connected = connection?.connected === true
  const topicDataUrl = starterTopic && starterDevice
    ? `/iotroot/dashboard/devices/${starterDevice.id}/topics/${starterTopic.id}/data`
    : '/iotroot/dashboard/data'

  function changeField(key, value) {
    setForm(current => ({ ...current, [key]: value }))
    setDownloaded(false)
    setCopied(false)
  }

  function downloadSketch() {
    if (!ready) return
    const blob = new Blob([generatedSketch], { type: 'text/x-arduino;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'iotroot-temperature.ino'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    setDownloaded(true)
  }

  async function copySketch() {
    if (!ready) return
    try {
      await navigator.clipboard.writeText(generatedSketch)
      setCopied(true)
      setCopyError('')
    } catch {
      setCopyError('Could not copy automatically. Open the preview and copy the code manually.')
    }
  }

  const resourcesUnavailable = !topicsLoading && topics !== null && (!starterTopic || !starterDevice)

  return <section className="grid min-h-full content-start gap-6 bg-[#f2f3f3] p-6 max-sm:p-4">
    <header className="flex items-start justify-between gap-5 max-[760px]:flex-col">
      <div><p className="m-0 text-xs font-bold uppercase tracking-[.16em] text-[#8390fa]">Quick start</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1d2f6f]">Send your first temperature reading</h1></div>
      <Link className={secondaryButton} to="/iotroot/dashboard">Back to overview</Link>
    </header>

    <ol className="grid grid-cols-3 overflow-hidden rounded border border-[#d5dbdb] bg-white shadow-sm max-[760px]:grid-cols-1">
      {[
        [1, 'Configure', 'Add Wi-Fi details'],
        [2, 'Upload', 'Flash your board'],
        [3, 'View data', 'Watch readings arrive'],
      ].map(([number, title, description]) => <li className="border-r border-slate-200 p-4 last:border-r-0 max-[760px]:border-b max-[760px]:border-r-0" key={number}><button type="button" className="flex w-full items-center gap-3 text-left" onClick={() => setActiveStep(number)}><StepMarker number={number} active={activeStep === number} complete={number === 1 ? downloaded : number === 2 ? uploaded : false} /><span><strong className="block text-sm text-slate-900">{title}</strong><small className="mt-0.5 block text-xs text-slate-500">{description}</small></span></button></li>)}
    </ol>

    {(topicsError || resourcesUnavailable) && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><span>{topicsError || 'Your starter device and stored topic could not be found. New accounts receive them automatically.'}</span><div className="flex gap-2"><button className={secondaryButton} type="button" disabled={refreshing || topicsLoading} onClick={async () => { await store.refresh(); await store.loadTopics(true) }}>Retry</button><Link className={secondaryButton} to="/iotroot/dashboard/devices">Manage devices</Link></div></div>}

    {activeStep === 1 && <article className="grid grid-cols-[minmax(0,1fr)_minmax(300px,.8fr)] overflow-hidden border border-[#d5dbdb] bg-white shadow-sm max-[960px]:grid-cols-1">
      <div className="p-6 max-sm:p-4">
        <div className="flex items-start gap-3"><StepMarker number="1" active complete={downloaded} /><div><h2 className="m-0 text-xl font-semibold">Configure and download</h2><p className="mt-1 text-sm leading-6 text-slate-500">We replace the placeholders in the sketch with your Wi-Fi and automatically-created MQTT details.</p></div></div>
        <form className="mt-6 grid gap-4" onSubmit={event => { event.preventDefault(); downloadSketch() }}>
          <label className="grid gap-2 text-xs font-semibold" htmlFor="starter-ssid">Wi-Fi network (SSID)<input className={inputClass} id="starter-ssid" value={form.ssid} onChange={event => changeField('ssid', event.target.value)} placeholder="Home WiFi" autoComplete="off" required /></label>
          <label className="grid gap-2 text-xs font-semibold" htmlFor="starter-wifi-password">Wi-Fi password<input className={inputClass} id="starter-wifi-password" type="password" value={form.wifiPassword} onChange={event => changeField('wifiPassword', event.target.value)} placeholder="Enter the Wi-Fi password" autoComplete="off" required /></label>
          <label className="grid gap-2 text-xs font-semibold" htmlFor="starter-account-password">IoTRoot account password<input className={inputClass} id="starter-account-password" type="password" value={form.accountPassword} onChange={event => changeField('accountPassword', event.target.value)} placeholder="Same password used to create your account" autoComplete="off" required /><small className="font-normal leading-5 text-slate-500">Your starter device was created with this password. It is used only to generate this download and is never saved by this page.</small></label>
          <div className="mt-1 flex flex-wrap gap-2"><button className={primaryButton} type="submit" disabled={!ready}>Download Arduino sketch</button><button className={secondaryButton} type="button" onClick={copySketch} disabled={!ready}>{copied ? 'Copied' : 'Copy code'}</button><button className={secondaryButton} type="button" onClick={() => setShowCode(value => !value)}>{showCode ? 'Hide preview' : 'Preview code'}</button></div>
          {!ready && <p className="m-0 text-xs text-slate-500">Enter all three fields and wait for the starter connection details to load.</p>}
          {copyError && <p role="alert" className="m-0 rounded bg-red-50 p-3 text-sm text-red-700">{copyError}</p>}
          {downloaded && <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><span>Sketch downloaded with your connection details.</span><button className="font-semibold underline" type="button" onClick={() => setActiveStep(2)}>Continue to upload →</button></div>}
        </form>
      </div>
      <aside className="border-l border-slate-200 bg-[#f7f8fc] p-6 max-[960px]:border-l-0 max-[960px]:border-t max-sm:p-4"><h3 className="m-0 text-sm font-semibold">Starter connection</h3><p className="mt-1 text-xs leading-5 text-slate-500">Created automatically when the account was registered.</p><div className="mt-4"><SetupSummary device={starterDevice} topic={starterTopic} host={host} port={port} /></div><div className="mt-4 rounded border border-[#fac748] bg-amber-50 p-3 text-xs leading-5 text-amber-900"><strong>Keep the sketch private.</strong> The downloaded file contains both Wi-Fi and MQTT passwords.</div></aside>
      {showCode && <div className="col-span-full border-t border-slate-200 bg-[#17265b] p-5 max-[960px]:col-span-1"><div className="mb-3 flex items-center justify-between"><strong className="text-xs uppercase tracking-wide text-[#fac748]">iotroot-temperature.ino</strong><span className="text-xs text-slate-300">Passwords are visible below</span></div><pre className="m-0 max-h-[520px] overflow-auto whitespace-pre text-xs leading-6 text-slate-100"><code>{generatedSketch}</code></pre></div>}
    </article>}

    {activeStep === 2 && <article className="border border-[#d5dbdb] bg-white p-6 shadow-sm max-sm:p-4">
      <div className="flex items-start gap-3"><StepMarker number="2" active complete={uploaded} /><div><h2 className="m-0 text-xl font-semibold">Upload the sketch</h2><p className="mt-1 text-sm leading-6 text-slate-500">Use Arduino IDE with an ESP32 or another Arduino board that has Wi-Fi support.</p></div></div>
      <div className="mt-6 grid grid-cols-[minmax(220px,.55fr)_minmax(0,1.45fr)] gap-6 max-[760px]:grid-cols-1">
        <section><h3 className="m-0 text-xs font-bold uppercase tracking-wide text-slate-500">Choose your board</h3><div className="mt-3 grid gap-2">{['ESP32', 'Wi-Fi Arduino'].map(value => <button type="button" key={value} onClick={() => setBoard(value)} className={`rounded border p-4 text-left ${board === value ? 'border-[#8390fa] bg-[#eef0ff] text-[#1d2f6f]' : 'border-slate-300 bg-white'}`}><strong className="block text-sm">{value}</strong><small className="mt-1 block text-xs opacity-75">{value === 'ESP32' ? 'Recommended for the provided WiFi.h sketch' : 'UNO R4 WiFi, Nano 33 IoT, or compatible'}</small></button>)}</div></section>
        <section><h3 className="m-0 text-base font-semibold">Arduino IDE checklist</h3><ol className="mt-4 grid gap-4 p-0">{[
          ['Open the download', 'Place iotroot-temperature.ino in a folder with the same name, then open it in Arduino IDE.'],
          ['Install PubSubClient', 'Open Library Manager, search for PubSubClient by Nick O’Leary, and install it.'],
          ['Select board and port', `Choose your ${board} model under Tools > Board, then select its USB port.`],
          ['Upload and inspect', 'Click Upload, then open Serial Monitor at 115200 baud to see connection and publish messages.'],
        ].map(([title, text], index) => <li className="flex gap-3" key={title}><span className="grid size-7 shrink-0 place-items-center rounded bg-[#eef0ff] text-xs font-bold text-[#1d2f6f]">{index + 1}</span><div><strong className="text-sm">{title}</strong><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div></li>)}</ol></section>
      </div>
      <label className="mt-7 flex cursor-pointer items-center gap-3 rounded border border-slate-200 bg-slate-50 p-4 text-sm font-semibold"><input className="size-4 accent-[#1d2f6f]" type="checkbox" checked={uploaded} onChange={event => setUploaded(event.target.checked)} />I uploaded the sketch and opened Serial Monitor</label>
      <div className="mt-5 flex justify-between gap-3"><button className={secondaryButton} type="button" onClick={() => setActiveStep(1)}>← Back</button><button className={primaryButton} type="button" disabled={!uploaded} onClick={() => setActiveStep(3)}>Check live data →</button></div>
    </article>}

    {activeStep === 3 && <article className="border border-[#d5dbdb] bg-white p-6 shadow-sm max-sm:p-4">
      <div className="flex items-start gap-3"><StepMarker number="3" active /><div><h2 className="m-0 text-xl font-semibold">View the stored data</h2><p className="mt-1 text-sm leading-6 text-slate-500">The sketch publishes valid JSON every three seconds. Open the topic data page to see the latest reading, chart, and message history.</p></div></div>
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_minmax(260px,.65fr)] gap-5 max-[760px]:grid-cols-1">
        <section className="rounded border border-slate-200 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="m-0 text-xs font-bold uppercase tracking-wide text-slate-500">Starter device</p><h3 className="mt-1 text-lg font-semibold">{starterDevice?.username || 'Waiting for device'}</h3></div><span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${connected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}><i className={`size-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />{connected ? 'Connected' : 'Waiting for connection'}</span></div><dl className="mt-5 grid gap-3 text-xs"><div><dt className="text-slate-500">Stored topic</dt><dd className="mt-1 break-all font-mono font-semibold">{starterTopic?.topic || 'Unavailable'}</dd></div><div><dt className="text-slate-500">Example payload</dt><dd className="mt-1"><code className="inline-block rounded bg-[#17265b] px-3 py-2 text-white">{'{"temperature":27.4}'}</code></dd></div><div><dt className="text-slate-500">Publish interval</dt><dd className="mt-1 font-semibold">Every 3 seconds</dd></div></dl></section>
        <section className="grid content-center justify-items-start rounded bg-[#1d2f6f] p-6 text-white"><span className="grid size-11 place-items-center rounded-full bg-white/10 text-xl" aria-hidden="true">↗</span><h3 className="mb-0 mt-4 text-lg font-semibold">Your live topic view is ready</h3><p className="mt-2 text-sm leading-6 text-slate-200">It refreshes automatically and turns numeric temperature fields into a chart.</p><Link className="mt-5 inline-flex rounded bg-[#fac748] px-4 py-2.5 text-sm font-semibold text-[#1d2f6f] no-underline" to={topicDataUrl}>View live stored data →</Link></section>
      </div>
      {!connected && <p className="mt-5 rounded border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">If the device stays offline, check Serial Monitor for the Wi-Fi or MQTT error code, confirm the passwords, and upload the sketch again.</p>}
      <div className="mt-5"><button className={secondaryButton} type="button" onClick={() => setActiveStep(2)}>← Back to upload</button></div>
    </article>}
  </section>
}
