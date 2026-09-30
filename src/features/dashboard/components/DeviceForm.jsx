import { useState } from 'react'
import { createDevice, updateDevice } from '../api/deviceApi'
import { useWorkspace } from '../realtime/useWorkspace'
import { WorkspaceDialog } from './WorkspaceDialog'

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
      onSaved(response.data)
    } catch (err) { setError(err.message || 'Could not save device.') }
    finally { setBusy(false) }
  }
  return (
    <WorkspaceDialog title={device ? 'Edit device' : 'Add device'} onClose={onClose} busy={busy}>
      <form className="dashboard-form" onSubmit={submit}>
        <label htmlFor="device-name">Device name<input id="device-name" value={form.username} onChange={e => change('username', e.target.value)} placeholder="living-room-esp32" required autoFocus /></label>
        <label htmlFor="device-password">{device ? 'New password (optional)' : 'Password'}<input id="device-password" type="password" value={form.password} onChange={e => change('password', e.target.value)} required={!device} autoComplete="new-password" /></label>
        <label htmlFor="device-mountpoint">Mountpoint (optional)<input id="device-mountpoint" value={form.mountpoint} onChange={e => change('mountpoint', e.target.value)} placeholder="/" /></label>
        {error && <p role="alert" className="dashboard-message dashboard-message-error">{error}</p>}
        <div className="workspace-dialog-actions"><button type="button" className="dashboard-secondary-button" onClick={onClose} disabled={busy}>Cancel</button><button className="dashboard-primary-button" disabled={busy}>{busy ? 'Saving…' : device ? 'Save changes' : 'Add device'}</button></div>
      </form>
    </WorkspaceDialog>
  )
}
