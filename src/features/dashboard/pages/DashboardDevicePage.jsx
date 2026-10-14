import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { deleteDevice, deleteDeviceRule } from '../api/deviceApi'
import { DeviceDetails } from '../components/DeviceDetails'
import { DeviceForm } from '../components/DeviceForm'
import { TopicCommands } from '../components/TopicCommands'
import { TopicForm } from '../components/TopicForm'
import { WorkspaceDialog } from '../components/WorkspaceDialog'
import { permissionLabels } from '../mqttCommands'
import { useWorkspace } from '../realtime/useWorkspace'
import { deviceStatus } from '../workspaceFilters'

const buttonPrimary = 'rounded bg-[#1d2f6f] px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-[#8390fa] disabled:opacity-50'
const buttonSecondary = 'rounded border border-slate-300 bg-white px-3.5 py-2 text-[13px] font-medium text-[#1d2f6f] hover:bg-[#eef0ff] disabled:opacity-50'

export function DashboardDevicePage() {
  const { deviceId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { devices, deviceStatuses, topics, topicsLoading, topicsError, error, store } = useWorkspace()
  const [editingDevice, setEditingDevice] = useState(false)
  const [editingTopic, setEditingTopic] = useState(null)
  const [selectedTopicId, setSelectedTopicId] = useState(null)
  const [deletingDevice, setDeletingDevice] = useState(false)
  const [deletingTopic, setDeletingTopic] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const isTopics = location.pathname.endsWith('/topics')
  const device = devices?.find(item => String(item.id) === deviceId)
  const connection = deviceStatus(deviceStatuses[deviceId])
  const deviceTopics = useMemo(
    () => (topics ?? []).filter(topic => String(topic.deviceId) === deviceId),
    [topics, deviceId],
  )
  const selectedTopic = deviceTopics.find(topic => String(topic.id) === String(selectedTopicId))

  useEffect(() => {
    if (isTopics) store.loadTopics()
  }, [isTopics, store])

  async function confirmDeviceDelete() {
    if (busy || !device) return
    setBusy(true)
    setActionError('')
    try {
      await deleteDevice(device.id)
      store.removeDevice(device.id)
      navigate('/iotroot/dashboard/devices', { replace: true })
    } catch (err) {
      setActionError(err.message || 'Could not delete device.')
      setBusy(false)
    }
  }

  async function confirmTopicDelete() {
    if (busy || !deletingTopic) return
    setBusy(true)
    setActionError('')
    try {
      await deleteDeviceRule(deletingTopic.deviceId, deletingTopic.id)
      store.removeTopic(deletingTopic)
      setDeletingTopic(null)
      setSelectedTopicId(null)
      setNotice('Topic deleted.')
    } catch (err) {
      setActionError(err.message || 'Could not delete topic.')
    } finally {
      setBusy(false)
    }
  }

  if (devices === null) {
    return <p className="text-sm text-slate-500">{error || 'Loading device…'}</p>
  }

  if (!device) {
    return <section className="grid min-h-full gap-6 bg-[#f2f3f3] p-6 max-sm:p-4"><Link className="text-sm font-semibold text-[#1d2f6f]" to="/iotroot/dashboard/devices">← Devices</Link><article className="border border-slate-300 bg-white p-14 text-center"><h2 className="text-xl font-semibold">Device not found</h2><p className="mt-2 text-sm text-slate-500">The device may have been removed or the URL is incorrect.</p></article></section>
  }

  const tabClass = ({ isActive }) => `border-b-[3px] px-5 py-3 text-sm font-semibold no-underline ${isActive ? 'border-[#8390fa] text-[#1d2f6f]' : 'border-transparent text-slate-500 hover:text-[#1d2f6f]'}`

  return (
    <section className="min-h-[calc(100dvh-36px)] bg-[#f2f3f3]">
      <header className="border-b border-[#d5dbdb] bg-white px-6 pt-5 max-[760px]:px-4">
        <nav className="mb-4 flex items-center gap-2 text-xs text-slate-500" aria-label="Breadcrumb">
          <Link className="font-semibold text-[#1d2f6f]" to="/iotroot/dashboard/devices">Devices</Link>
          <span>/</span>
          <span>{device.username}</span>
        </nav>

        <div className="flex items-start justify-between gap-4 pb-5 max-sm:flex-wrap">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="m-0 text-2xl font-semibold text-[#16191f]">{device.username}</h1>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${connection === 'connected' ? 'bg-[#e8eaff] text-[#1d2f6f]' : connection === 'disconnected' ? 'bg-[#fff3bf] text-[#7a5c00]' : 'bg-slate-100 text-slate-600'}`}>
                {connection === 'connected' ? 'Connected' : connection === 'disconnected' ? 'Disconnected' : 'Unknown'}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-8 gap-y-1 text-[13px] text-slate-500">
              <span><strong className="font-semibold text-slate-700">Device name:</strong> {device.username}</span>
              <span><strong className="font-semibold text-slate-700">Client ID:</strong> <code>{device.clientId || 'Not assigned'}</code></span>
              <span><strong className="font-semibold text-slate-700">Mount point:</strong> <code>{device.mountpoint || '/'}</code></span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className={buttonSecondary} onClick={() => setEditingDevice(true)}>Edit</button>
            <button className="rounded border border-red-200 bg-white px-3.5 py-2 text-[13px] text-red-700 hover:bg-red-50" onClick={() => setDeletingDevice(true)}>Delete</button>
          </div>
        </div>

        <nav className="flex" aria-label="Device sections">
          <NavLink end className={tabClass} to={`/iotroot/dashboard/devices/${device.id}`}>Overview</NavLink>
          <NavLink className={tabClass} to={`/iotroot/dashboard/devices/${device.id}/topics`}>Topics <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">{topics === null ? '—' : deviceTopics.length}</span></NavLink>
        </nav>
      </header>

      <div className="p-6 max-[760px]:p-4">
        {notice && <p className="mb-5 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
        {!isTopics ? (
          <DeviceDetails key={device.id} device={device} />
        ) : (
          <section className="grid gap-5">
            <div className="flex items-center justify-between gap-4">
              <div><h2 className="m-0 text-xl font-semibold text-[#16191f]">Topics</h2><p className="mt-1 text-[13px] text-slate-500">MQTT access rules configured for this device.</p></div>
              <button className={buttonPrimary} onClick={() => setEditingTopic({})} disabled={topicsLoading}>Add topic</button>
            </div>
            {topicsError && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{topicsError}</p>}
            <article className="overflow-hidden border border-[#d5dbdb] bg-white">
              <table className="w-full min-w-[620px] border-collapse text-left">
                <thead><tr>{['Topic', 'Permission', 'Actions'].map(label => <th className="bg-[#eef0ff] px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#1d2f6f]" key={label}>{label}</th>)}</tr></thead>
                <tbody>
                  {deviceTopics.map(topic => (
                    <tr className="cursor-pointer border-t border-slate-200 hover:bg-[#f7f8fc]" key={topic.id} onClick={() => setSelectedTopicId(topic.id)}>
                      <td className="px-6 py-4"><span className="block font-mono text-xs font-semibold text-[#1d2f6f]">{topic.topic}</span>{topic.topicType === 'STORE' && <span className="mt-1 inline-block rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Stored JSON</span>}</td>
                      <td className="px-6 py-4"><span className="rounded bg-[#eef0ff] px-2 py-1 text-[11px] font-semibold text-[#1d2f6f]">{permissionLabels[topic.permission] ?? topic.permission}</span></td>
                      <td className="px-6 py-4"><div className="flex gap-3"><button className="font-semibold text-[#1d2f6f]" onClick={() => setSelectedTopicId(topic.id)}>Details</button>{topic.topicType === 'STORE' && <Link className="font-semibold text-emerald-700" to={`/iotroot/dashboard/devices/${device.id}/topics/${topic.id}/data`} onClick={event => event.stopPropagation()}>View data →</Link>}</div></td>
                    </tr>
                  ))}
                  {!deviceTopics.length && <tr><td className="px-6 py-14 text-center text-sm text-slate-500" colSpan={3}>{topicsLoading || topics === null ? 'Loading topics…' : 'No topics yet. Add the first topic for this device.'}</td></tr>}
                </tbody>
              </table>
            </article>
          </section>
        )}
      </div>

      {selectedTopic && (
        <>
          <button className="fixed inset-0 top-9 z-30 cursor-default bg-slate-950/30" aria-label="Close topic details" onClick={() => setSelectedTopicId(null)} />
          <aside className="fixed bottom-0 right-0 top-9 z-40 w-[min(680px,100vw)] overflow-y-auto border-l border-slate-300 bg-white shadow-2xl" aria-label="Topic details">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div><p className="m-0 text-xs font-bold uppercase tracking-wide text-[#8390fa]">Topic details</p><h2 className="mt-1 break-all font-mono text-lg font-semibold text-[#16191f]">{selectedTopic.topic}</h2></div>
              <button className="grid size-9 place-items-center rounded border border-slate-300 text-xl" onClick={() => setSelectedTopicId(null)} aria-label="Close">×</button>
            </header>
            <div className="grid gap-6 p-6">
              <dl className="grid grid-cols-2 gap-4 rounded border border-slate-200 bg-[#f7f8fc] p-4 text-sm">
                <div><dt className="text-xs text-slate-500">Device</dt><dd className="mt-1 font-semibold">{device.username}</dd></div>
                <div><dt className="text-xs text-slate-500">Permission</dt><dd className="mt-1 font-semibold">{permissionLabels[selectedTopic.permission] ?? selectedTopic.permission}</dd></div>
                <div><dt className="text-xs text-slate-500">Topic type</dt><dd className="mt-1 font-semibold">{selectedTopic.topicType === 'STORE' ? 'Stored JSON data' : 'Standard MQTT'}</dd></div>
                <div className="col-span-2"><dt className="text-xs text-slate-500">Topic filter</dt><dd className="mt-1 break-all font-mono text-xs">{selectedTopic.topic}</dd></div>
              </dl>
              <TopicCommands key={`${device.id}-${selectedTopic.id}`} device={device} topic={selectedTopic} />
              <div className="flex justify-end gap-2 border-t border-slate-200 pt-5">
                {selectedTopic.topicType === 'STORE' && <Link className={buttonSecondary} to={`/iotroot/dashboard/devices/${device.id}/topics/${selectedTopic.id}/data`}>View stored data</Link>}
                <button className="rounded border border-red-200 bg-white px-3.5 py-2 text-[13px] text-red-700" onClick={() => setDeletingTopic(selectedTopic)}>Delete</button>
                <button className={buttonPrimary} onClick={() => setEditingTopic(selectedTopic)}>Edit topic</button>
              </div>
            </div>
          </aside>
        </>
      )}

      {editingDevice && <DeviceForm device={device} onClose={() => setEditingDevice(false)} onSaved={() => { setEditingDevice(false); setNotice('Device updated.') }} />}
      {editingTopic && <TopicForm topic={editingTopic.id != null ? editingTopic : null} defaultDeviceId={deviceId} onClose={() => setEditingTopic(null)} onSaved={() => { setNotice(editingTopic.id != null ? 'Topic updated.' : 'Topic added.'); setEditingTopic(null) }} />}
      {deletingDevice && <WorkspaceDialog title="Delete device" onClose={() => setDeletingDevice(false)} busy={busy}>
        <div className="flex gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-red-100 text-xl font-bold text-red-700">!</span><div><h3 className="m-0 text-base font-semibold text-slate-900">Permanently delete {device.username}?</h3><p className="mt-2 text-sm leading-6 text-slate-600">This removes the device, its credentials, topic access rules, and stored workspace data. This action cannot be undone.</p></div></div>
        {actionError && <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
        <div className="-mx-6 -mb-6 mt-6 flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4"><button className={buttonSecondary} disabled={busy} onClick={() => setDeletingDevice(false)}>Cancel</button><button className="rounded bg-red-700 px-4 py-2 text-[13px] font-semibold text-white hover:bg-red-800 disabled:opacity-50" disabled={busy} onClick={confirmDeviceDelete}>{busy ? 'Deleting…' : 'Delete device'}</button></div>
      </WorkspaceDialog>}
      {deletingTopic && <WorkspaceDialog title="Delete topic" onClose={() => setDeletingTopic(null)} busy={busy}>
        <div className="flex gap-4"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-red-100 text-xl font-bold text-red-700">!</span><div className="min-w-0"><h3 className="m-0 text-base font-semibold text-slate-900">Remove this topic rule?</h3><p className="mt-2 break-all rounded bg-slate-100 p-2 font-mono text-xs text-slate-700">{deletingTopic.topic}</p><p className="mt-2 text-sm leading-6 text-slate-600">The device will immediately lose the configured publish or subscribe access.</p></div></div>
        {actionError && <p className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
        <div className="-mx-6 -mb-6 mt-6 flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4"><button className={buttonSecondary} disabled={busy} onClick={() => setDeletingTopic(null)}>Cancel</button><button className="rounded bg-red-700 px-4 py-2 text-[13px] font-semibold text-white hover:bg-red-800 disabled:opacity-50" disabled={busy} onClick={confirmTopicDelete}>{busy ? 'Deleting…' : 'Delete topic'}</button></div>
      </WorkspaceDialog>}
    </section>
  )
}
