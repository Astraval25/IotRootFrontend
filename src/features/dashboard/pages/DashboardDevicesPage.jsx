import { useEffect, useState } from 'react'
import {
  createDevice,
  deleteDevice,
  fetchDeviceById,
  fetchDevices,
  updateDevice,
} from '../api/deviceApi'

const initialForm = {
  username: '',
  password: '',
  mountpoint: '',
}

export function DashboardDevicesPage() {
  const [devices, setDevices] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function loadDevices(showLoader = false) {
    if (showLoader) {
      setIsLoading(true)
    }

    try {
      const response = await fetchDevices()
      setDevices(response.data ?? [])
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load devices.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isDisposed = false

    async function initializeDevices() {
      try {
        const response = await fetchDevices()

        if (!isDisposed) {
          setDevices(response.data ?? [])
        }
      } catch (error) {
        if (!isDisposed) {
          setErrorMessage(error.message || 'Failed to load devices.')
        }
      } finally {
        if (!isDisposed) {
          setIsLoading(false)
        }
      }
    }

    initializeDevices()

    return () => {
      isDisposed = true
    }
  }, [])

  function updateForm(key, value) {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  function resetForm() {
    setForm(initialForm)
    setEditingId(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const payload = {
        username: form.username.trim(),
        password: form.password,
        mountpoint: form.mountpoint.trim(),
      }

      if (editingId) {
        const response = await updateDevice(editingId, payload)
        setMessage(response.message || 'Device updated.')
      } else {
        const response = await createDevice(payload)
        setMessage(response.message || 'Device created.')
      }

      resetForm()
      await loadDevices()
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save device.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEdit(deviceId) {
    setMessage('')
    setErrorMessage('')

    try {
      const response = await fetchDeviceById(deviceId)
      const device = response.data

      setEditingId(device.id)
      setForm({
        username: device.username || '',
        password: '',
        mountpoint: device.mountpoint || '',
      })
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load device details.')
    }
  }

  async function handleDelete(deviceId) {
    setMessage('')
    setErrorMessage('')

    try {
      const response = await deleteDevice(deviceId)
      setMessage(response.message || 'Device deleted.')

      if (editingId === deviceId) {
        resetForm()
      }

      await loadDevices()
    } catch (error) {
      setErrorMessage(error.message || 'Failed to delete device.')
    }
  }

  return (
    <section className="dashboard-section">
      <header className="dashboard-section-header">
        <div>
          <h2>Device Management</h2>
          <p>Manage connected device credentials and identifiers for your IoT platform.</p>
        </div>

        <button className="dashboard-secondary-button" type="button" onClick={() => loadDevices(true)}>
          Refresh
        </button>
      </header>

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <h3>{editingId ? `Edit Device #${editingId}` : 'Create Device'}</h3>
          <form className="dashboard-form" onSubmit={handleSubmit}>
            <label htmlFor="device-username">
              Username
              <input
                id="device-username"
                value={form.username}
                onChange={(event) => updateForm('username', event.target.value)}
                placeholder="node_1"
                required
              />
            </label>

            <label htmlFor="device-password">
              Password
              <input
                id="device-password"
                type="password"
                value={form.password}
                onChange={(event) => updateForm('password', event.target.value)}
                placeholder={editingId ? 'Enter new password' : 'Enter password'}
                required
              />
            </label>

            <label htmlFor="device-mountpoint">
              Mountpoint
              <input
                id="device-mountpoint"
                value={form.mountpoint}
                onChange={(event) => updateForm('mountpoint', event.target.value)}
                placeholder="/"
              />
            </label>

            <div className="dashboard-form-actions">
              <button className="dashboard-primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingId ? 'Update Device' : 'Create Device'}
              </button>

              {editingId ? (
                <button
                  className="dashboard-secondary-button"
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>

          {errorMessage ? <p className="dashboard-message dashboard-message-error">{errorMessage}</p> : null}
          {message ? <p className="dashboard-message dashboard-message-success">{message}</p> : null}
        </article>

        <article className="dashboard-card">
          <h3>Devices</h3>
          {isLoading ? (
            <p className="dashboard-muted">Loading devices...</p>
          ) : devices.length === 0 ? (
            <p className="dashboard-muted">No devices found.</p>
          ) : (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Client ID</th>
                    <th>Mountpoint</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => (
                    <tr key={device.id}>
                      <td>{device.id}</td>
                      <td>{device.username || '-'}</td>
                      <td className="dashboard-truncate">{device.clientId || '-'}</td>
                      <td>{device.mountpoint || '-'}</td>
                      <td>
                        <div className="dashboard-row-actions">
                          <button type="button" onClick={() => handleEdit(device.id)}>
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDelete(device.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}
