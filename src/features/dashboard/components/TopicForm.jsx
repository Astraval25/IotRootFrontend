import { useState } from 'react'
import { createDeviceRule, updateDeviceRule } from '../api/deviceApi'
import { getCurrentUserId } from '../../auth/session/authSession'
import { useWorkspace } from '../realtime/useWorkspace'
import { WorkspaceDialog } from './WorkspaceDialog'

const fieldClass = 'min-h-11 w-full rounded border border-slate-300 bg-white px-3.5 text-sm outline-none focus:border-[#8390fa] focus:ring-2 focus:ring-[#8390fa]/20'

export function TopicForm({ topic, defaultDeviceId = '', onClose, onSaved }) {
  const { devices, store } = useWorkspace()
  const userId = getCurrentUserId()
  const standardPrefix = `/iot/${userId}/`
  const storePrefix = `/iot/store/${userId}/`
  const inferredType = topic?.topicType ?? (topic?.topic?.startsWith(storePrefix) ? 'STORE' : 'STANDARD')
  const [topicType, setTopicType] = useState(inferredType)
  const prefix = topicType === 'STORE' ? storePrefix : standardPrefix
  const [deviceId, setDeviceId] = useState(topic ? String(topic.deviceId) : defaultDeviceId)
  const existingPrefix = inferredType === 'STORE' ? storePrefix : standardPrefix
  const [suffix, setSuffix] = useState(topic?.topic?.startsWith(existingPrefix) ? topic.topic.slice(existingPrefix.length) : topic?.topic ?? '')
  const [permission, setPermission] = useState(topic?.permission ?? 'publish')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const payload = { topic: suffix.trim().replace(/^\/+/, ''), permission, topicType }
      if (!payload.topic || !deviceId) throw new Error('Choose a device and enter a topic.')
      const response = topic ? await updateDeviceRule(deviceId, topic.id, payload) : await createDeviceRule(deviceId, payload)
      store.upsertTopic({ ...response.data, deviceId })
      onSaved()
    } catch (err) { setError(err.message || 'Could not save topic.') }
    finally { setBusy(false) }
  }
  return (
    <WorkspaceDialog title={topic ? 'Edit topic' : 'Add topic'} onClose={onClose} busy={busy}>
      <form className="grid gap-5" onSubmit={submit}>
        <p className="m-0 text-sm text-slate-500">{topic ? 'Update this MQTT topic filter and its allowed operation.' : 'Create a topic rule that controls what this device can publish or subscribe to.'}</p>
        <label className="grid gap-2 text-[13px] font-semibold text-slate-700" htmlFor="topic-device">Device<select className={fieldClass} id="topic-device" value={deviceId} onChange={e => setDeviceId(e.target.value)} disabled={Boolean(topic)} required autoFocus><option value="">Choose a device</option>{(devices ?? []).map(device => <option key={device.id} value={device.id}>{device.username} (#{device.id})</option>)}</select></label>
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-[13px] font-semibold text-slate-700">Topic type</legend>
          <div className="grid grid-cols-2 gap-2 max-sm:grid-cols-1">
            {[
              ['STANDARD', 'Standard topic', 'Normal MQTT publish and subscribe access'],
              ['STORE', 'Store JSON data', 'Persist JSON published below the /iot/store/ namespace'],
            ].map(([value, label, hint]) => (
              <label className={`cursor-pointer rounded border p-3 ${topicType === value ? 'border-[#8390fa] bg-[#eef0ff]' : 'border-slate-300 bg-white'}`} key={value}>
                <input className="sr-only" type="radio" name="topicType" value={value} checked={topicType === value} onChange={e => { setTopicType(e.target.value); if (!suffix) setSuffix(e.target.value === 'STORE' ? '#' : '') }} />
                <strong className="block text-[13px] text-[#1d2f6f]">{label}</strong>
                <small className="mt-1 block text-[11px] font-normal leading-4 text-slate-500">{hint}</small>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="grid gap-2 text-[13px] font-semibold text-slate-700" htmlFor="topic-suffix">
          {topicType === 'STORE' ? 'Stored data path' : 'Topic filter'}
          <div className="flex min-w-0 overflow-hidden rounded border border-slate-300 bg-white focus-within:border-[#8390fa] focus-within:ring-2 focus-within:ring-[#8390fa]/20">
            <span className="flex max-w-[55%] items-center overflow-x-auto border-r border-slate-300 bg-slate-50 px-3 font-mono text-xs text-slate-500">{prefix}</span>
            <input className="min-h-11 min-w-0 flex-1 border-0 px-3 font-mono text-sm outline-none" id="topic-suffix" value={suffix} onChange={e => setSuffix(e.target.value)} placeholder={topicType === 'STORE' ? 'sensors/#' : 'sensors/temperature'} required />
          </div>
          <small className="font-normal text-slate-500">{topicType === 'STORE' ? <>Use <code>#</code> to allow all stored paths. Devices must publish valid JSON to a concrete matching topic.</> : <>Wildcards <code>+</code> and <code>#</code> are supported for topic filters.</>}</small>
        </label>
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-[13px] font-semibold text-slate-700">Permission</legend>
          <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-1">
            {[['publish', 'Publish', 'Send messages'], ['subscribe', 'Subscribe', 'Receive messages'], ['readwrite', 'Both', 'Send and receive']].map(([value, label, hint]) => (
              <label className={`cursor-pointer rounded border p-3 ${permission === value ? 'border-[#8390fa] bg-[#eef0ff]' : 'border-slate-300 bg-white'}`} key={value}>
                <input className="sr-only" type="radio" name="permission" value={value} checked={permission === value} onChange={e => setPermission(e.target.value)} />
                <strong className="block text-[13px] text-[#1d2f6f]">{label}</strong>
                <small className="mt-1 block text-[11px] font-normal text-slate-500">{hint}</small>
              </label>
            ))}
          </div>
        </fieldset>
        {error && <p role="alert" className="m-0 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="-mx-6 -mb-6 mt-1 flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4"><button type="button" className="rounded border border-slate-300 bg-white px-4 py-2 text-[13px] font-semibold text-[#1d2f6f] hover:bg-[#eef0ff] disabled:opacity-50" onClick={onClose} disabled={busy}>Cancel</button><button className="rounded bg-[#1d2f6f] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#8390fa] disabled:opacity-50" disabled={busy}>{busy ? 'Saving…' : topic ? 'Save changes' : 'Add topic'}</button></div>
      </form>
    </WorkspaceDialog>
  )
}
