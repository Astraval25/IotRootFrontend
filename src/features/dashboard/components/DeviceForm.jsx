import { useState } from 'react'
import { createDevice, updateDevice } from '../api/deviceApi'
import { useWorkspace } from '../realtime/useWorkspace'
import { WorkspaceDialog } from './WorkspaceDialog'

const inputClass = 'min-h-11 rounded border border-slate-300 px-3.5 text-sm outline-none focus:border-[#8390fa] focus:ring-2 focus:ring-[#8390fa]/20'

export function DeviceForm({ device, onClose, onSaved }) {
  const { store } = useWorkspace()
  const [form, setForm] = useState({ username: device?.username ?? '', password: '', mountpoint: device?.mountpoint ?? '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const change = (key, value) => setForm(previous => ({ ...previous, [key]: value }))
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const payload = { ...form, username: form.username.trim(), mountpoint: form.mountpoint.trim() }
      if (!payload.username) throw new Error('Enter a device name.')
      if (device && !payload.password) delete payload.password
      const response = device ? await updateDevice(device.id, payload) : await createDevice(payload)
      store.upsertDevice(response.data)
      if (payload.password) store.rememberDevicePassword(response.data.id, payload.password)
      onSaved(response.data)
    } catch (err) { setError(err.message || 'Could not save device.') }
    finally { setBusy(false) }
  }
  return (
    <WorkspaceDialog title={device ? 'Edit device' : 'Add device'} onClose={onClose} busy={busy}>
      <form className="grid gap-5" onSubmit={submit}>
        <p className="m-0 text-sm text-slate-500">{device ? 'Update the device identity or rotate its password.' : 'Create credentials for a new MQTT device.'}</p>
        <label className="grid gap-2 text-[13px] font-semibold text-slate-700" htmlFor="device-name">Device name<input className={inputClass} id="device-name" value={form.username} onChange={e => change('username', e.target.value)} placeholder="living-room-esp32" required autoFocus /><small className="font-normal text-slate-500">A clear name used throughout the IoTRoot console.</small></label>
        <label className="grid gap-2 text-[13px] font-semibold text-slate-700" htmlFor="device-password">{device ? 'New password' : 'Password'}<input className={inputClass} id="device-password" type="password" value={form.password} onChange={e => change('password', e.target.value)} required={!device} autoComplete="new-password" placeholder={device ? 'Leave blank to keep current password' : 'Enter a secure password'} /><small className="font-normal text-slate-500">{device ? 'Only enter a value when rotating the password.' : 'Used when this device connects to the broker.'}</small></label>
        <label className="grid gap-2 text-[13px] font-semibold text-slate-700" htmlFor="device-mountpoint">Mount point<input className={`${inputClass} font-mono`} id="device-mountpoint" value={form.mountpoint} onChange={e => change('mountpoint', e.target.value)} placeholder="/" /><small className="font-normal text-slate-500">Optional namespace prefix. Use <code>/</code> for the default.</small></label>
        {error && <p role="alert" className="m-0 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="-mx-6 -mb-6 mt-1 flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4"><button type="button" className="rounded border border-slate-300 bg-white px-4 py-2 text-[13px] font-semibold text-[#1d2f6f] hover:bg-[#eef0ff] disabled:opacity-50" onClick={onClose} disabled={busy}>Cancel</button><button className="rounded bg-[#1d2f6f] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#8390fa] disabled:opacity-50" disabled={busy}>{busy ? 'Saving…' : device ? 'Save changes' : 'Add device'}</button></div>
      </form>
    </WorkspaceDialog>
  )
}
