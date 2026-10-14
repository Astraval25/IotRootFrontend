import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useWorkspace } from '../realtime/useWorkspace'
import { DeviceForm } from '../components/DeviceForm'
import { filterDevices, deviceStatus } from '../workspaceFilters'

export function DashboardDevicesPage() {
  const navigate = useNavigate()
  const { devices, deviceStatuses, refreshing, error, store } = useWorkspace()
  const [params, setParams] = useSearchParams()
  const [adding, setAdding] = useState(params.get('add') === '1')
  const [notice, setNotice] = useState('')
  const search = params.get('q') ?? ''
  const status = params.get('status') ?? ''
  const rows = filterDevices(devices ?? [], deviceStatuses, { search, status })

  function changeParam(key, value) {
    setParams(previous => {
      const next = new URLSearchParams(previous)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    }, { replace: true })
  }

  function openDevice(deviceId) {
    navigate(`/iotroot/dashboard/devices/${deviceId}`)
  }

  return (
    <section className="grid min-h-full gap-6 bg-[#f2f3f3] p-6 max-sm:p-4">
      <header className="flex items-center justify-between gap-4 max-sm:flex-wrap">
        <div>
          <h2 className="m-0 text-2xl font-semibold tracking-tight text-[#1d2f6f]">Devices</h2>
          <p className="mt-1.5 text-[13px] text-slate-500">Manage connected things and inspect their connection state.</p>
        </div>
        <div className="flex gap-2.5">
          <button className="rounded border border-slate-300 bg-white px-3.5 py-2 text-[13px] font-medium text-[#1d2f6f] hover:bg-[#eef0ff] disabled:opacity-50" onClick={() => store.refresh()} disabled={refreshing}>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button className="rounded bg-[#1d2f6f] px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-[#8390fa]" onClick={() => setAdding(true)}>Add device</button>
        </div>
      </header>

      {error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}

      <article className="min-w-0 overflow-hidden rounded-sm border border-[#d5dbdb] bg-white shadow-sm">
        <div className="flex flex-wrap items-end gap-4 border-b border-[#dfe3ef] bg-[#fbfbfd] px-6 py-4">
          <label className="grid min-w-[220px] flex-1 gap-1.5 text-[11px] font-medium text-slate-600">
            Find devices
            <input className="min-h-10 w-full rounded border border-slate-300 bg-white px-3 text-[13px] text-slate-800 outline-none focus:border-[#8390fa]" type="search" value={search} onChange={event => changeParam('q', event.target.value)} placeholder="Search by device name or mount point" />
          </label>
          <label className="grid min-w-[150px] gap-1.5 text-[11px] font-medium text-slate-600">
            Status
            <select className="min-h-10 rounded border border-slate-300 bg-white px-3 text-[13px]" value={status} onChange={event => changeParam('status', event.target.value)}>
              <option value="">All statuses</option>
              <option value="connected">Connected</option>
              <option value="disconnected">Disconnected</option>
              <option value="unknown">Unknown</option>
            </select>
          </label>
          {(search || status) && (
            <button className="min-h-10 border-0 bg-transparent text-xs font-semibold text-[#1d2f6f]" onClick={() => setParams({}, { replace: true })}>
              Clear filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <caption className="sr-only">All registered devices. Select a row to open its details.</caption>
            <thead>
              <tr>
                <th className="bg-[#eef0ff] px-6 py-3.5 text-[11px] font-medium uppercase tracking-wide text-[#1d2f6f]" scope="col">Device name</th>
                <th className="bg-[#eef0ff] px-6 py-3.5 text-[11px] font-medium uppercase tracking-wide text-[#1d2f6f]" scope="col">Mount point</th>
                <th className="bg-[#eef0ff] px-6 py-3.5 text-[11px] font-medium uppercase tracking-wide text-[#1d2f6f]" scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(device => {
                const connection = deviceStatus(deviceStatuses[String(device.id)])
                return (
                  <tr key={device.id} className="h-[66px] cursor-pointer border-b border-slate-200 hover:bg-[#fff9df]" onClick={() => openDevice(device.id)}>
                    <td className="px-6 py-4">
                      <button className="border-0 bg-transparent p-0 text-left font-semibold text-[#1d2f6f] hover:text-[#8390fa] hover:underline" onClick={() => openDevice(device.id)}>
                        {device.username}
                      </button>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{device.mountpoint || '/'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${connection === 'connected' ? 'bg-[#e8eaff] text-[#1d2f6f]' : connection === 'disconnected' ? 'bg-[#fff3bf] text-[#7a5c00]' : 'bg-slate-100 text-slate-600'}`}>
                        {connection === 'connected' ? 'Connected' : connection === 'disconnected' ? 'Disconnected' : 'Unknown'}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {!rows.length && (
                <tr>
                  <td colSpan={3}>
                    <div className="px-5 py-14 text-center text-sm text-slate-500">
                      {devices === null ? error ? 'Devices unavailable. Try Refresh.' : 'Loading devices…' : devices.length ? 'No devices match your filters.' : 'No devices yet. Add your first device.'}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <footer className="border-t border-slate-200 px-6 py-3.5 text-[11px] text-slate-500">{rows.length} of {devices?.length ?? 0} devices</footer>
      </article>

      {adding && (
        <DeviceForm
          device={null}
          onClose={() => setAdding(false)}
          onSaved={device => {
            setAdding(false)
            setNotice('Device added.')
            openDevice(device.id)
          }}
        />
      )}
    </section>
  )
}
