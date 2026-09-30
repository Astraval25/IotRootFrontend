import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { deleteDeviceRule } from '../api/deviceApi'
import { useWorkspace } from '../realtime/useWorkspace'
import { DeviceForm } from '../components/DeviceForm'
import { TopicForm } from '../components/TopicForm'
import { WorkspaceDialog } from '../components/WorkspaceDialog'
import { filterTopics } from '../workspaceFilters'

const permissionLabels = { publish: 'Publish', subscribe: 'Subscribe', readwrite: 'Publish & subscribe' }

export function DashboardTopicsPage() {
  const { devices, topics, topicsLoading, topicsError, store } = useWorkspace()
  const [params, setParams] = useSearchParams()
  const [editor, setEditor] = useState(null)
  const [addingDevice, setAddingDevice] = useState(false)
  const [selected, setSelected] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => { store.loadTopics() }, [store])
  const search = params.get('q') ?? ''
  const deviceId = params.get('device') ?? ''
  const permission = params.get('permission') ?? ''
  const rows = filterTopics(topics ?? [], devices ?? [], { search, deviceId, permission })
  const deviceName = id => devices?.find(device => String(device.id) === String(id))?.username || `Device #${id}`
  function changeParam(key, value) {
    setParams(previous => { const next = new URLSearchParams(previous); if (value) next.set(key, value); else next.delete(key); return next }, { replace: true })
  }
  async function confirmDelete() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await deleteDeviceRule(deleting.deviceId, deleting.id)
      store.removeTopic(deleting)
      setDeleting(null)
      setSelected(null)
      setNotice('Topic deleted.')
    } catch (err) { setError(err.message || 'Could not delete topic.') }
    finally { setBusy(false) }
  }
  return <section className="dashboard-section">
    <header className="dashboard-section-header"><div><h2>Topics <span className="workspace-count">{topics?.length ?? '—'}</span></h2><p>Topic access rules</p></div><div className="dashboard-form-actions"><button className="dashboard-secondary-button" onClick={() => store.loadTopics(true)} disabled={topicsLoading}>{topicsLoading ? 'Refreshing…' : 'Refresh'}</button><button className="dashboard-secondary-button" onClick={() => setAddingDevice(true)}>+ Add device</button><button className="dashboard-primary-button" onClick={() => setEditor({})} disabled={!devices?.length || topics === null || topicsLoading}>+ Add topic</button></div></header>
    {topicsError && <p role="alert" className="dashboard-message dashboard-message-error">{topicsError}</p>}
    {notice && <p role="status" className="dashboard-message dashboard-message-success">{notice}</p>}
    <article className="dashboard-card workspace-table-card">
      <div className="workspace-filters">
        <label className="workspace-search">Search topics<input type="search" placeholder="Topic or device name" value={search} onChange={e => changeParam('q', e.target.value)} /></label>
        <label>Device<select value={deviceId} onChange={e => changeParam('device', e.target.value)}><option value="">All devices</option>{(devices ?? []).map(device => <option key={device.id} value={device.id}>{device.username} (#{device.id})</option>)}</select></label>
        <label>Permission<select value={permission} onChange={e => changeParam('permission', e.target.value)}><option value="">All permissions</option>{Object.entries(permissionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        {(search || deviceId || permission) && <button className="workspace-text-button" onClick={() => setParams({}, { replace: true })}>Clear filters</button>}
      </div>
      <div className="dashboard-table-wrap"><table className="dashboard-table workspace-data-table">
        <caption className="workspace-sr-only">Topic access rules for all devices. Select a topic for details.</caption>
        <thead><tr><th scope="col">Topic</th><th scope="col">Device name</th><th scope="col">Permission</th><th scope="col">Actions</th></tr></thead>
        <tbody>{rows.map(topic => <tr className="workspace-clickable-row" key={`${topic.deviceId}-${topic.id}`} onClick={e => { if (!e.target.closest('button, a')) setSelected(topic) }}>
          <td><button className="workspace-name-button workspace-topic-name" onClick={() => setSelected(topic)}>{topic.topic}</button></td><td><Link to={`/iotroot/dashboard/devices?device=${topic.deviceId}`}>{deviceName(topic.deviceId)}</Link></td><td><span className="workspace-permission">{permissionLabels[topic.permission] ?? topic.permission}</span></td><td><button className="dashboard-inline-action" disabled={topicsLoading} aria-label={`Edit ${topic.topic}`} onClick={() => setEditor(topic)}>Edit</button></td>
        </tr>)}{!rows.length && <tr><td colSpan={4}><div className="workspace-table-empty">{topics === null ? topicsError ? 'Topics unavailable. Try Refresh.' : 'Loading topics…' : !devices?.length ? 'Add a device to create topic rules.' : topics.length ? 'No topics match your filters.' : 'No topic rules yet. Add your first topic.'}</div></td></tr>}</tbody>
      </table></div><footer className="workspace-table-footer">{rows.length} of {topics?.length ?? 0} topics</footer>
    </article>
    {editor && <TopicForm key={editor.id ?? 'new'} topic={editor.id != null ? editor : null} defaultDeviceId={deviceId} onClose={() => setEditor(null)} onSaved={() => { setNotice(editor.id != null ? 'Topic updated.' : 'Topic added.'); setEditor(null); setSelected(null) }} />}
    {addingDevice && <DeviceForm onClose={() => setAddingDevice(false)} onSaved={device => { setAddingDevice(false); changeParam('device', String(device.id)); setNotice('Device added. You can now add a topic.') }} />}
    {selected && !editor && !deleting && <WorkspaceDialog title="Topic details" onClose={() => setSelected(null)}>
      <dl className="workspace-detail-list"><dt>Topic</dt><dd className="workspace-mono">{selected.topic}</dd><dt>Device</dt><dd><Link to={`/iotroot/dashboard/devices?device=${selected.deviceId}`}>{deviceName(selected.deviceId)}</Link></dd><dt>Permission</dt><dd>{permissionLabels[selected.permission]}</dd><dt>Rule ID</dt><dd>{selected.id}</dd></dl>
      <div className="workspace-dialog-actions"><button className="workspace-danger-button" disabled={topicsLoading} onClick={() => { setError(''); setDeleting(selected) }}>Delete topic</button><button className="dashboard-primary-button" disabled={topicsLoading} onClick={() => setEditor(selected)}>Edit topic</button></div>
    </WorkspaceDialog>}
    {deleting && <WorkspaceDialog title="Delete topic?" onClose={() => setDeleting(null)} busy={busy}><p className="workspace-break-word">Remove <strong>{deleting.topic}</strong> from {deviceName(deleting.deviceId)}?</p>{error && <p role="alert" className="dashboard-message dashboard-message-error">{error}</p>}<div className="workspace-dialog-actions"><button className="dashboard-secondary-button" onClick={() => setDeleting(null)} disabled={busy}>Cancel</button><button className="workspace-danger-button" onClick={confirmDelete} disabled={busy}>{busy ? 'Deleting…' : 'Delete topic'}</button></div></WorkspaceDialog>}
  </section>
}
