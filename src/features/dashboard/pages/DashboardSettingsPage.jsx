import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../../shared/config/env'
import { clearSession, getAccessTokenPayload } from '../../auth/session/authSession'
import { SettingsSideNavigation } from '../components/SettingsSideNavigation'
import { ApiKeysSettings } from '../components/ApiKeysSettings'

function getBrokerHost() {
  try {
    return new URL(API_BASE_URL).hostname
  } catch {
    return 'iotroot.astraval.com'
  }
}

export function DashboardSettingsPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('service')
  const [copied, setCopied] = useState('')
  const brokerHost = getBrokerHost()
  const tokenPayload = getAccessTokenPayload()
  const email = tokenPayload?.email || tokenPayload?.preferred_username || tokenPayload?.unique_name || 'Email unavailable'
  const details = [
    ['Broker endpoint', brokerHost],
    ['MQTT port', '1883'],
    ['MQTT over TLS', '8883'],
    ['WebSocket port', '8083'],
    ['WebSocket TLS port', '8084'],
    ['Protocol', 'MQTT 3.1.1 / MQTT 5.0'],
    ['Authentication', 'Device username and password'],
    ['Keep alive', '60 seconds recommended'],
  ]
  const sectionCopy = {
    service: ['Service', 'Common connection values used by every device in this IoTRoot workspace.'],
    'api-keys': ['API keys', 'Create read-only credentials for the stored-data REST API.'],
    account: ['Account', 'Review your signed-in account and session.'],
  }

  async function copy(label, value) {
    await navigator.clipboard.writeText(value)
    setCopied(label)
  }

  function logout() {
    clearSession()
    navigate('/iotroot/login', { replace: true })
  }

  return (
    <section className="grid min-h-full grid-cols-[250px_minmax(0,1fr)] bg-[#f2f3f3] max-[820px]:grid-cols-1 max-[820px]:content-start">
      <SettingsSideNavigation activeSection={activeSection} onSectionChange={setActiveSection} />

      <div className="grid content-start gap-6 p-6 max-sm:p-4">
        <header>
          <h1 className="m-0 text-2xl font-semibold tracking-tight text-[#1d2f6f]">{sectionCopy[activeSection][0]}</h1>
          <p className="mt-1.5 text-[13px] text-slate-500">{sectionCopy[activeSection][1]}</p>
        </header>

      {activeSection === 'service' ? <>
        <article className="border border-[#d5dbdb] bg-white shadow-sm">
        <header className="flex items-start justify-between gap-5 border-b border-[#eaeded] px-5 py-[18px]">
          <div>
            <h3 className="m-0 text-[17px] font-semibold text-slate-900">Connection details</h3>
            <p className="mt-1 text-xs text-slate-500">Use these shared values when configuring your MQTT clients.</p>
          </div>
          <span className="border border-[#8390fa] bg-[#eef0ff] px-2 py-1 text-[11px] font-bold text-[#1d2f6f]">Shared</span>
        </header>
        <div className="grid">
          {details.map(([label, value]) => (
            <div className="grid min-h-[54px] grid-cols-[minmax(160px,.8fr)_minmax(240px,1.4fr)_auto] items-center gap-4 border-b border-[#eaeded] px-5 py-2.5 last:border-0 max-sm:grid-cols-[1fr_auto]" key={label}>
              <span className="text-xs font-semibold text-slate-600">{label}</span>
              <code className="break-all text-xs text-slate-900 max-sm:col-start-1 max-sm:row-start-2">{value}</code>
              <button className="border-0 bg-transparent text-xs font-bold text-[#1d2f6f] max-sm:col-start-2 max-sm:row-span-2 max-sm:row-start-1" type="button" onClick={() => copy(label, value)}>{copied === label ? 'Copied' : 'Copy'}</button>
            </div>
          ))}
        </div>
        </article>

        <article className="border border-[#d5dbdb] bg-white shadow-sm">
          <header className="border-b border-[#eaeded] px-5 py-[18px]"><div><h3 className="m-0 text-[17px] font-semibold">Quick connection</h3><p className="mt-1 text-xs text-slate-500">Example broker URL for standard MQTT clients.</p></div></header>
          <pre className="mx-5 my-4 overflow-x-auto border border-[#d5dbdb] bg-[#f7f8fc] p-3.5"><code>{`mqtt://${brokerHost}:1883`}</code></pre>
          <p className="mx-5 my-4 text-sm text-slate-600">Credentials are unique to each device. Open a device to view its username and live session information.</p>
        </article>
      </> : activeSection === 'api-keys' ? <ApiKeysSettings /> : (
        <article className="border border-[#d5dbdb] bg-white shadow-sm">
          <header className="border-b border-[#eaeded] px-5 py-[18px]">
            <h3 className="m-0 text-[17px] font-semibold text-slate-900">Account details</h3>
            <p className="mt-1 text-xs text-slate-500">Information associated with your current IoTRoot session.</p>
          </header>
          <div className="flex items-center gap-4 border-b border-[#eaeded] px-5 py-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#1d2f6f] text-sm font-bold text-[#fac748]">{email === 'Email unavailable' ? 'IR' : email.slice(0, 2).toUpperCase()}</span>
            <div className="min-w-0">
              <p className="m-0 text-xs font-semibold text-slate-500">Email address</p>
              <p className="mt-1 truncate text-sm font-medium text-slate-900">{email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 px-5 py-5 max-sm:items-start max-sm:flex-col">
            <div>
              <p className="m-0 text-sm font-semibold text-slate-900">Logout</p>
              <p className="mt-1 text-xs text-slate-500">End this session and return to the login page.</p>
            </div>
            <button className="border border-[#1d2f6f] bg-white px-4 py-2 text-sm font-semibold text-[#1d2f6f] hover:bg-[#eef0ff]" type="button" onClick={logout}>Logout</button>
          </div>
        </article>
      )}
      </div>
    </section>
  )
}
