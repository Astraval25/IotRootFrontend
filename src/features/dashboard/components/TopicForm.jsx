import { useState } from 'react'
import { createDeviceRule, updateDeviceRule } from '../api/deviceApi'
import { getCurrentUserId } from '../../auth/session/authSession'
import { useWorkspace } from '../realtime/useWorkspace'
import { WorkspaceDialog } from './WorkspaceDialog'

export function TopicForm({ topic, defaultDeviceId = '', onClose, onSaved }) {
  const { devices, store } = useWorkspace()
  const prefix = `/iot/${getCurrentUserId()}/`
  const [deviceId, setDeviceId] = useState(topic ? String(topic.deviceId) : defaultDeviceId)
  const [suffix, setSuffix] = useState(topic?.topic?.startsWith(prefix) ? topic.topic.slice(prefix.length) : topic?.topic ?? '')
  const [permission, setPermission] = useState(topic?.permission ?? 'publish')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const payload = { topic: suffix.trim().replace(/^\/+/, ''), permission }
      if (!payload.topic || !deviceId) throw new Error('Choose a device and enter a topic.')
      const response = topic ? await updateDeviceRule(deviceId, topic.id, payload) : await createDeviceRule(deviceId, payload)
      store.upsertTopic({ ...response.data, deviceId })
      onSaved()
    } catch (err) { setError(err.message || 'Could not save topic.') }
    finally { setBusy(false) }
  }
  return <WorkspaceDialog title={topic ? 'Edit topic' : 'Add topic'} onClose={onClose} busy={busy}>
    <form className="dashboard-form" onSubmit={submit}>
      <label htmlFor="topic-device">Device<select id="topic-device" value={deviceId} onChange={e => setDeviceId(e.target.value)} disabled={Boolean(topic)} required autoFocus><option value="">Choose a device</option>{(devices ?? []).map(device => <option key={device.id} value={device.id}>{device.username} (#{device.id})</option>)}</select></label>
      <label htmlFor="topic-suffix">Topic<div className="dashboard-topic-input"><span className="dashboard-topic-prefix">{prefix}</span><input id="topic-suffix" value={suffix} onChange={e => setSuffix(e.target.value)} placeholder="sensors/temperature" required /></div></label>
      <label htmlFor="topic-permission">Permission<select id="topic-permission" value={permission} onChange={e => setPermission(e.target.value)}><option value="publish">Publish</option><option value="subscribe">Subscribe</option><option value="readwrite">Publish & subscribe</option></select></label>
      {error && <p role="alert" className="dashboard-message dashboard-message-error">{error}</p>}
      <div className="workspace-dialog-actions"><button type="button" className="dashboard-secondary-button" onClick={onClose} disabled={busy}>Cancel</button><button className="dashboard-primary-button" disabled={busy}>{busy ? 'Saving…' : topic ? 'Save changes' : 'Add topic'}</button></div>
    </form>
  </WorkspaceDialog>
}
