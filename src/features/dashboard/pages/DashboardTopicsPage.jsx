import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { deleteDeviceRule } from '../api/deviceApi'
import { useWorkspace } from '../realtime/useWorkspace'
import { DeviceForm } from '../components/DeviceForm'
import { TopicForm } from '../components/TopicForm'
import { TopicCommands } from '../components/TopicCommands'
import { WorkspaceDialog } from '../components/WorkspaceDialog'
import { countTopicsByDevice, deviceStatus, filterDevices, filterTopics } from '../workspaceFilters'
import { permissionLabels } from '../mqttCommands'

export function DashboardTopicsPage() {
  const { devices, deviceStatuses, topics, topicsLoading, topicsError, refreshing, error: workspaceError, store } = useWorkspace()
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
  const status = params.get('status') ?? ''
  const device = devices?.find(row => String(row.id) === deviceId)
  const counts = countTopicsByDevice(topics ?? [])
  const deviceRows = filterDevices(devices ?? [], deviceStatuses, { search, status })
  const topicRows = filterTopics(topics ?? [], devices ?? [], { search, deviceId, permission })
  const selectedTopic = topics?.find(row => String(row.deviceId) === deviceId && String(row.id) === String(selected))
  const loading = topicsLoading || refreshing

  function changeParam(key, value) {
    setParams(previous => {
      const next = new URLSearchParams(previous)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    }, { replace: true })
  }
  function openDevice(id) {
    setSelected(null)
    setNotice('')
    setParams({ device: String(id) })
  }
  async function refresh() {
    await store.refresh()
    await store.loadTopics(true)
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
    {deviceId && <nav className="workspace-breadcrumb" aria-label="Breadcrumb"><Link to="/iotroot/dashboard/topics">Topics</Link><span aria-hidden="true">/</span><span aria-current="page">{device?.username || 'Device'}</span></nav>}
    <header className="dashboard-section-header">
      <div><h2>{deviceId ? device?.username || 'Device topics' : 'Topics'} <span className="workspace-count">{deviceId ? topics === null ? '—' : counts[deviceId] ?? 0 : devices?.length ?? '—'}</span></h2><p>{deviceId ? 'Topic access rules' : 'Choose a device to view its topics.'}</p></div>
      <div className="dashboard-form-actions">
        <button className="dashboard-secondary-button" onClick={refresh} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
        {!deviceId && <button className="dashboard-primary-button" onClick={() => setAddingDevice(true)}>+ Add device</button>}
        {device && <><Link className="dashboard-secondary-button dashboard-link-button" to={`/iotroot/dashboard/devices?device=${device.id}`}>Device details</Link><button className="dashboard-primary-button" onClick={() => setEditor({})} disabled={topics === null || loading}>+ Add topic</button></>}
      </div>
    </header>
    {(topicsError || workspaceError) && <p role="alert" className="dashboard-message dashboard-message-error">{topicsError || workspaceError}</p>}
    {notice && <p role="status" className="dashboard-message dashboard-message-success">{notice}</p>}

    {deviceId && !device ? <article className="dashboard-card"><p className="dashboard-muted">{devices === null ? 'Loading device…' : 'Device not found.'}</p><Link to="/iotroot/dashboard/topics">Back to devices</Link></article> :
      <article className="dashboard-card workspace-table-card">
        <div className="workspace-filters">
          <label className="workspace-search">{deviceId ? 'Search topics' : 'Search devices'}<input type="search" placeholder={deviceId ? 'Topic name' : 'Device name or client ID'} value={search} onChange={e => changeParam('q', e.target.value)} /></label>
          {deviceId ? <label>Permission<select value={permission} onChange={e => changeParam('permission', e.target.value)}><option value="">All permissions</option>{Object.entries(permissionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label> :
            <label>Status<select value={status} onChange={e => changeParam('status', e.target.value)}><option value="">All statuses</option><option value="connected">Connected</option><option value="disconnected">Disconnected</option><option value="unknown">Unknown</option></select></label>}
          {(search || permission || status) && <button className="workspace-text-button" onClick={() => setParams(deviceId ? { device: deviceId } : {}, { replace: true })}>Clear filters</button>}
        </div>

        <div className="dashboard-table-wrap">
          {!deviceId ? <table className="dashboard-table workspace-data-table">
            <caption className="workspace-sr-only">All devices and their topic counts. Select a device to view its topics.</caption>
            <thead><tr><th scope="col">Device name</th><th scope="col">Client ID</th><th scope="col">Topics</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
            <tbody>{deviceRows.map(row => {
              const connection = deviceStatus(deviceStatuses[String(row.id)])
              return <tr className="workspace-clickable-row" key={row.id} onClick={event => { if (!event.target.closest('button, a')) openDevice(row.id) }}>
                <td><button className="workspace-name-button" onClick={() => openDevice(row.id)}>{row.username || `Device #${row.id}`}</button><small className="workspace-cell-subtitle">#{row.id}</small></td>
                <td className="workspace-mono">{row.clientId || '—'}</td>
                <td><span className="workspace-topic-count">{topics === null ? '—' : counts[String(row.id)] ?? 0}</span></td>
                <td><span className={`dashboard-device-status ${connection === 'connected' ? 'dashboard-device-status-online' : connection === 'disconnected' ? 'dashboard-device-status-offline' : 'workspace-status-unknown'}`}>{connection === 'connected' ? 'Connected' : connection === 'disconnected' ? 'Disconnected' : 'Unknown'}</span></td>
                <td><button className="dashboard-inline-action" onClick={() => openDevice(row.id)} aria-label={`View topics for ${row.username}`}>View topics →</button></td>
              </tr>
            })}{!deviceRows.length && <tr><td colSpan={5}><div className="workspace-table-empty">{devices === null ? workspaceError ? 'Devices unavailable. Try Refresh.' : 'Loading devices…' : devices.length ? 'No devices match your filters.' : 'No devices yet. Add your first device.'}</div></td></tr>}</tbody>
          </table> : <table className="dashboard-table workspace-data-table">
            <caption className="workspace-sr-only">Topics for {device.username}. Select a topic to view its commands.</caption>
            <thead><tr><th scope="col">Topic</th><th scope="col">Device name</th><th scope="col">Permission</th><th scope="col">Actions</th></tr></thead>
            <tbody>{topicRows.map(topic => <tr className="workspace-clickable-row" key={topic.id} onClick={event => { if (!event.target.closest('button, a')) setSelected(topic.id) }}>
              <td><button className="workspace-name-button workspace-topic-name" onClick={() => setSelected(topic.id)}>{topic.topic}</button></td>
              <td>{device.username}</td><td><span className="workspace-permission">{permissionLabels[topic.permission] ?? topic.permission}</span></td>
              <td><div className="dashboard-row-actions"><button onClick={() => setSelected(topic.id)} aria-label={`Commands for ${topic.topic}`}>Commands</button><button disabled={loading} aria-label={`Edit ${topic.topic}`} onClick={() => setEditor(topic)}>Edit</button></div></td>
            </tr>)}{!topicRows.length && <tr><td colSpan={4}><div className="workspace-table-empty">{topics === null ? topicsError ? 'Topics unavailable. Try Refresh.' : 'Loading topics…' : counts[deviceId] ? 'No topics match your filters.' : 'No topics yet. Add a topic for this device.'}</div></td></tr>}</tbody>
          </table>}
        </div>
        <footer className="workspace-table-footer">{deviceId ? `${topicRows.length} of ${counts[deviceId] ?? 0} topics` : `${deviceRows.length} of ${devices?.length ?? 0} devices`}</footer>
      </article>}

    {editor && <TopicForm key={editor.id ?? 'new'} topic={editor.id != null ? editor : null} defaultDeviceId={deviceId} onClose={() => setEditor(null)} onSaved={() => { setNotice(editor.id != null ? 'Topic updated.' : 'Topic added.'); setEditor(null) }} />}
    {addingDevice && <DeviceForm onClose={() => setAddingDevice(false)} onSaved={newDevice => { setAddingDevice(false); openDevice(newDevice.id); setNotice('Device added. Add your first topic.') }} />}
    {selectedTopic && device && !editor && !deleting && <WorkspaceDialog title="Topic details" wide onClose={() => setSelected(null)}>
      <dl className="workspace-detail-list topic-detail-summary"><div><dt>Topic</dt><dd className="workspace-mono">{selectedTopic.topic}</dd></div><div><dt>Device</dt><dd>{device.username}</dd></div><div><dt>Permission</dt><dd>{permissionLabels[selectedTopic.permission]}</dd></div></dl>
      <TopicCommands key={`${device.id}-${selectedTopic.id}`} device={device} topic={selectedTopic} />
      <div className="workspace-dialog-actions"><button className="workspace-danger-button" disabled={loading} onClick={() => { setError(''); setDeleting(selectedTopic) }}>Delete topic</button><button className="dashboard-primary-button" disabled={loading} onClick={() => setEditor(selectedTopic)}>Edit topic</button></div>
    </WorkspaceDialog>}
    {deleting && <WorkspaceDialog title="Delete topic?" onClose={() => setDeleting(null)} busy={busy}><p className="workspace-break-word">Remove <strong>{deleting.topic}</strong> from {device?.username}?</p>{error && <p role="alert" className="dashboard-message dashboard-message-error">{error}</p>}<div className="workspace-dialog-actions"><button className="dashboard-secondary-button" onClick={() => setDeleting(null)} disabled={busy}>Cancel</button><button className="workspace-danger-button" onClick={confirmDelete} disabled={busy}>{busy ? 'Deleting…' : 'Delete topic'}</button></div></WorkspaceDialog>}
  </section>
}
