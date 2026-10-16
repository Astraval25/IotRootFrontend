import { Link } from 'react-router-dom'
import { useWorkspace } from '../realtime/useWorkspace'

const steps = [
  { number: '1', title: 'Configure', text: 'Use the starter device and stored topic created with your account to personalize a ready-made sketch.', link: '/iotroot/dashboard/getting-started', action: 'Open the guide' },
  { number: '2', title: 'Connect', text: 'Upload the sketch to an ESP32 or Wi-Fi capable Arduino and connect securely to the MQTT broker.', link: '/iotroot/dashboard/devices', action: 'Check the device' },
  { number: '3', title: 'Explore', text: 'Inspect stored JSON, follow live temperature readings, and access device data through HTTPS APIs.', link: '/iotroot/dashboard/data', action: 'View stored data' },
]

export function DashboardOverviewPage() {
  const { error: errorMessage, store, refreshing } = useWorkspace()
  return <section className="grid min-h-full content-start gap-8 bg-[#f2f3f3] p-6 max-sm:p-4">
    <header className="-m-6 mb-0 grid grid-cols-[minmax(0,1fr)_320px] items-stretch gap-8 bg-[#223044] px-8 py-10 text-white max-[900px]:grid-cols-1 max-sm:-m-4 max-sm:mb-0 max-sm:px-5 max-sm:py-7">
      <div className="py-2"><p className="m-0 text-lg font-bold">IoTRoot <span className="text-[#fac748]">IoT</span></p><h1 className="mt-4 max-w-3xl text-4xl font-light leading-tight max-sm:text-3xl">Securely connect, test, and manage your IoT devices</h1><p className="mt-4 max-w-3xl text-sm leading-6 text-slate-200">IoTRoot gives your devices a secure MQTT connection, controls which topics they can use, stores JSON messages, and exposes stored data through simple HTTPS APIs.</p><div className="mt-6 flex flex-wrap gap-3"><Link className="rounded bg-[#fac748] px-4 py-2.5 text-sm font-semibold text-[#1d2f6f] no-underline" to="/iotroot/dashboard/devices">Manage devices</Link><Link className="rounded border border-white/40 px-4 py-2.5 text-sm font-semibold text-white no-underline hover:bg-white/10" to="/iotroot/dashboard/data">Explore stored data</Link></div></div>
      <aside className="grid min-h-[260px] content-between border border-white/20 bg-[#f2f3f3] p-6 text-[#16191f] shadow-lg"><div><span className="grid size-11 place-items-center rounded-full bg-[#eef0ff] text-xl text-[#1d2f6f]" aria-hidden="true">→</span><h2 className="mb-0 mt-5 text-xl font-semibold text-[#1d2f6f]">Get started with IoTRoot</h2><p className="mt-2 text-sm leading-6 text-slate-600">Configure a ready-made ESP32 or Arduino sketch, send temperature data every three seconds, and see it stored live.</p></div><Link className="mt-5 inline-flex w-fit rounded bg-[#1d2f6f] px-4 py-2.5 text-sm font-semibold text-white no-underline hover:bg-[#8390fa]" to="/iotroot/dashboard/getting-started">Start the guided setup →</Link></aside>
    </header>
    {errorMessage && <p role="alert" className="m-0 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}<button className="ml-3 rounded border border-slate-300 bg-white px-3 py-1.5 font-semibold text-[#1d2f6f] disabled:opacity-50" onClick={() => store.refresh()} disabled={refreshing}>Retry</button></p>}
    <section><h2 className="mb-4 text-2xl font-semibold">Getting started</h2><article className="grid grid-cols-[minmax(260px,.8fr)_minmax(0,1.2fr)] gap-8 border border-[#d5dbdb] bg-white p-6 shadow-sm max-[800px]:grid-cols-1"><div><h3 className="m-0 text-lg font-semibold">Send your first device message</h3><p className="mt-2 text-sm leading-6 text-slate-600">Create a device to receive its MQTT credentials, then add a topic and send your first message.</p><Link className="mt-4 inline-flex rounded bg-[#1d2f6f] px-4 py-2.5 text-sm font-semibold text-white no-underline" to="/iotroot/dashboard/devices?add=1">Start setup</Link></div><ol className="m-0 grid gap-3 p-0"><GuideStep number="1" title="Create a device" text="Choose a name and save the generated credentials." /><GuideStep number="2" title="Add a topic rule" text="Allow publish, subscribe, or stored JSON access." /><GuideStep number="3" title="Copy and run" text="Use the generated command to send your first message." last /></ol></article></section>
    <section><h2 className="mb-4 text-2xl font-semibold">How it works</h2><article className="border border-[#d5dbdb] bg-white shadow-sm"><p className="m-0 border-b border-slate-200 px-5 py-4 text-sm">Use the console to connect your hardware, verify communication, and manage its data.</p><div className="grid grid-cols-3 max-[850px]:grid-cols-1">{steps.map(step => <OverviewStep key={step.number} {...step} />)}</div></article></section>
  </section>
}

function OverviewStep({ number, title, text, link, action }) {
  return <section className="grid min-h-64 content-start gap-4 border-r border-slate-200 p-5 last:border-r-0 max-[850px]:min-h-0 max-[850px]:border-b max-[850px]:border-r-0"><div className="grid size-16 place-items-center rounded-full border border-[#8390fa] bg-[#eef0ff] text-2xl font-light text-[#1d2f6f]">{number}</div><div><h3 className="m-0 text-base font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div><Link className="mt-auto text-sm font-semibold text-[#1d2f6f] no-underline hover:underline" to={link}>{action} →</Link></section>
}

function GuideStep({ number, title, text, last = false }) {
  return <li className={`flex gap-3 pb-3 ${last ? '' : 'border-b border-slate-200'}`}><span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#eef0ff] text-xs font-bold text-[#1d2f6f]">{number}</span><div><strong className="text-sm">{title}</strong><p className="mt-1 text-xs text-slate-500">{text}</p></div></li>
}
