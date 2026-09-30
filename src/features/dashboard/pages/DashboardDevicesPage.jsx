import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { deleteDevice } from '../api/deviceApi'
import { useWorkspace } from '../realtime/useWorkspace'
import { DeviceForm } from '../components/DeviceForm'
import { DeviceDetails } from '../components/DeviceDetails'
import { WorkspaceDialog } from '../components/WorkspaceDialog'
import { filterDevices, deviceStatus } from '../workspaceFilters'

export function DashboardDevicesPage() {
  const { devices, deviceStatuses, refreshing, error, store } = useWorkspace()
  const [params, setParams] = useSearchParams()
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const search = params.get('q') ?? ''
  const status = params.get('status') ?? ''
  const selected = devices?.find(device => String(device.id) === params.get('device'))
  const adding = params.get('add') === '1'
  const rows = filterDevices(devices ?? [], deviceStatuses, { search, status })
  function changeParam(key, value) {
    setParams(previous => { const next = new URLSearchParams(previous); if (value) next.set(key, value); else next.delete(key); return next }, { replace: true })
  }
  function closeEditor() { setEditing(null); changeParam('add', '') }
  async function confirmDelete() {
    if (busy) return
    setBusy(true)
    setActionError('')
    try {
      await deleteDevice(deleting.id)
      store.removeDevice(deleting.id)
      setDeleting(null)
      changeParam('device', '')
      setNotice('Device deleted.')
    } catch (err) { setActionError(err.message || 'Could not delete device.') }
    finally { setBusy(false) }
  }
  return (
    <section className="dashboard-section">
      <header className="dashboard-section-header"><div><h2>Devices <span className="workspace-count">{devices?.length ?? '—'}</span></h2></div><div className="dashboard-form-actions"><button className="dashboard-secondary-button" onClick={() => store.refresh()} disabled={refreshing}>{refreshing ? 'Refreshing…' : 'Refresh'}</button><button className="dashboard-primary-button" onClick={() => changeParam('add', '1')}>+ Add device</button></div></header>
      {error && <p role="alert" className="dashboard-message dashboard-message-error">{error}</p>}
      {notice && <p role="status" className="dashboard-message dashboard-message-success">{notice}</p>}
      <article className="dashboard-card workspace-table-card">
        <div className="workspace-filters">
          <label className="workspace-search">Search devices<input type="search" value={search} onChange={e => changeParam('q', e.target.value)} placeholder="Name, client ID, or mountpoint" /></label>
          <label>Status<select value={status} onChange={e => changeParam('status', e.target.value)}><option value="">All statuses</option><option value="connected">Connected</option><option value="disconnected">Disconnected</option><option value="unknown">Unknown</option></select></label>
          {(search || status) && <button className="workspace-text-button" onClick={() => setParams(previous => { const next = new URLSearchParams(previous); next.delete('q'); next.delete('status'); return next }, { replace: true })}>Clear filters</button>}
        </div>
        <div className="dashboard-table-wrap">
          <table className="dashboard-table workspace-data-table">
            <caption className="workspace-sr-only">Devices. Select a device name to view its details.</caption>
            <thead><tr><th scope="col">Device name</th><th scope="col">Client ID</th><th scope="col">Mountpoint</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
            <tbody>
              {rows.map(device => {
                const connection = deviceStatus(deviceStatuses[String(device.id)])
                return <tr key={device.id} className="workspace-clickable-row" onClick={e => { if (!e.target.closest('button, a')) changeParam('device', String(device.id)) }}>
                  <td><button className="workspace-name-button" onClick={() => changeParam('device', String(device.id))}>{device.username || `Device #${device.id}`}</button><small className="workspace-cell-subtitle">#{device.id}</small></td>
                  <td className="workspace-mono">{device.clientId || '—'}</td><td>{device.mountpoint || '/'}</td>
                  <td><span className={`dashboard-device-status ${connection === 'connected' ? 'dashboard-device-status-online' : connection === 'disconnected' ? 'dashboard-device-status-offline' : 'workspace-status-unknown'}`}>{connection === 'connected' ? 'Connected' : connection === 'disconnected' ? 'Disconnected' : 'Unknown'}</span></td>
                  <td><button className="dashboard-inline-action" onClick={() => setEditing(device)} aria-label={`Edit ${device.username}`}>Edit</button></td>
                </tr>
              })}
              {!rows.length && <tr><td colSpan={5}><div className="workspace-table-empty">{devices === null ? error ? 'Devices unavailable. Try Refresh.' : 'Loading devices…' : devices.length ? 'No devices match your filters.' : 'No devices yet. Add your first device.'}</div></td></tr>}
            </tbody>
          </table>
        </div>
        <footer className="workspace-table-footer">{rows.length} of {devices?.length ?? 0} devices</footer>
      </article>
      {(adding || editing) && <DeviceForm key={editing?.id ?? 'new'} device={editing} onClose={closeEditor} onSaved={device => { closeEditor(); changeParam('device', String(device.id)); setNotice(editing ? 'Device updated.' : 'Device added.') }} />}
      {selected && !adding && !editing && !deleting && <WorkspaceDialog title={selected.username || `Device #${selected.id}`} wide onClose={() => changeParam('device', '')}>
        <div className="workspace-detail-actions"><button className="dashboard-secondary-button" onClick={() => setEditing(selected)}>Edit device</button><button className="workspace-danger-button" onClick={() => { setActionError(''); setDeleting(selected) }}>Delete device</button></div>
        <DeviceDetails key={selected.id} device={selected} />
      </WorkspaceDialog>}
      {deleting && <WorkspaceDialog title="Delete device?" onClose={() => setDeleting(null)} busy={busy}><p>Delete <strong>{deleting.username}</strong> and its topic access rules?</p>{actionError && <p role="alert" className="dashboard-message dashboard-message-error">{actionError}</p>}<div className="workspace-dialog-actions"><button className="dashboard-secondary-button" disabled={busy} onClick={() => setDeleting(null)}>Cancel</button><button className="workspace-danger-button" disabled={busy} onClick={confirmDelete}>{busy ? 'Deleting…' : 'Delete device'}</button></div></WorkspaceDialog>}
    </section>
  )
}
