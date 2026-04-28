import { useEffect, useState } from 'react'
import {
  createDeviceRule,
  deleteDeviceRule,
  fetchDeviceRules,
  fetchDevices,
  updateDeviceRule,
} from '../api/deviceApi'
import { getCurrentUserId } from '../../auth/session/authSession'

const initialForm = {
  topic: '',
  permission: 'publish',
}

const permissions = ['publish', 'subscribe', 'readwrite']

function normalizeTopicInput(topic) {
  return topic.trim().replace(/^\/+/, '')
}

function getTopicPrefix(userId) {
  return userId ? `/iot/${userId}/` : '/iot/user_id/'
}

function stripTopicPrefix(topic, userId) {
  const prefix = getTopicPrefix(userId)
  return topic?.startsWith(prefix) ? topic.slice(prefix.length) : topic ?? ''
}

export function DashboardTopicsPage() {
  const [devices, setDevices] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [rules, setRules] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingRuleId, setEditingRuleId] = useState(null)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoadingDevices, setIsLoadingDevices] = useState(true)
  const [isLoadingRules, setIsLoadingRules] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const userId = getCurrentUserId()
  const topicPrefix = getTopicPrefix(userId)

  useEffect(() => {
    let isDisposed = false

    async function initializeDevices() {
      try {
        const response = await fetchDevices()
        const nextDevices = response.data ?? []

        if (!isDisposed) {
          setDevices(nextDevices)
          setSelectedDeviceId(nextDevices[0]?.id ? String(nextDevices[0].id) : '')
        }
      } catch (error) {
        if (!isDisposed) {
          setErrorMessage(error.message || 'Failed to load devices.')
        }
      } finally {
        if (!isDisposed) {
          setIsLoadingDevices(false)
        }
      }
    }

    initializeDevices()

    return () => {
      isDisposed = true
    }
  }, [])

  useEffect(() => {
    if (!selectedDeviceId) {
      return
    }

    let isDisposed = false

    async function loadRules() {
      setIsLoadingRules(true)

      try {
        const response = await fetchDeviceRules(selectedDeviceId)

        if (!isDisposed) {
          setRules(response.data ?? [])
        }
      } catch (error) {
        if (!isDisposed) {
          setErrorMessage(error.message || 'Failed to load rules.')
          setRules([])
        }
      } finally {
        if (!isDisposed) {
          setIsLoadingRules(false)
        }
      }
    }

    loadRules()

    return () => {
      isDisposed = true
    }
  }, [selectedDeviceId])

  function updateForm(key, value) {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  function resetForm() {
    setForm(initialForm)
    setEditingRuleId(null)
  }

  async function reloadRules() {
    if (!selectedDeviceId) {
      setRules([])
      return
    }

    setIsLoadingRules(true)

    try {
      const response = await fetchDeviceRules(selectedDeviceId)
      setRules(response.data ?? [])
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load rules.')
      setRules([])
    } finally {
      setIsLoadingRules(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')

    if (!selectedDeviceId) {
      setErrorMessage('Select a device before managing rules.')
      return
    }

    const topic = normalizeTopicInput(form.topic)

    if (!topic) {
      setErrorMessage('Topic is required.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        topic,
        permission: form.permission,
      }

      if (editingRuleId) {
        const response = await updateDeviceRule(selectedDeviceId, editingRuleId, payload)
        setMessage(response.message || 'Rule updated.')
      } else {
        const response = await createDeviceRule(selectedDeviceId, payload)
        setMessage(response.message || 'Rule added.')
      }

      resetForm()
      await reloadRules()
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save rule.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleEdit(rule) {
    setMessage('')
    setErrorMessage('')
    setEditingRuleId(rule.id)
    setForm({
      topic: stripTopicPrefix(rule.topic, userId),
      permission: rule.permission || 'publish',
    })
  }

  async function handleDelete(ruleId) {
    if (!selectedDeviceId) {
      return
    }

    setMessage('')
    setErrorMessage('')

    try {
      const response = await deleteDeviceRule(selectedDeviceId, ruleId)
      setMessage(response.message || 'Rule deleted.')

      if (editingRuleId === ruleId) {
        resetForm()
      }

      await reloadRules()
    } catch (error) {
      setErrorMessage(error.message || 'Failed to delete rule.')
    }
  }

  return (
    <section className="dashboard-section">
      <header className="dashboard-section-header">
        <div>
          <h2>Topic Rules</h2>
          <p>Create ACL rules per device. The `/iot/{userId}` prefix is fixed from your login session.</p>
        </div>

        <button
          className="dashboard-secondary-button"
          type="button"
          onClick={() => reloadRules()}
          disabled={!selectedDeviceId || isLoadingRules}
        >
          Refresh
        </button>
      </header>

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <h3>{editingRuleId ? `Edit Rule #${editingRuleId}` : 'Create Rule'}</h3>
          <form className="dashboard-form" onSubmit={handleSubmit}>
            <label htmlFor="topic-device">
              Device
              <select
                id="topic-device"
                value={selectedDeviceId}
                onChange={(event) => {
                  setSelectedDeviceId(event.target.value)
                  setMessage('')
                  setErrorMessage('')
                  resetForm()
                }}
                disabled={isLoadingDevices || devices.length === 0}
              >
                <option value="">Select device</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.username || `Device #${device.id}`} (ID: {device.id})
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="rule-permission">
              Permission
              <select
                id="rule-permission"
                value={form.permission}
                onChange={(event) => updateForm('permission', event.target.value)}
              >
                {permissions.map((permission) => (
                  <option key={permission} value={permission}>
                    {permission}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="rule-topic">
              Topic
              <div className="dashboard-topic-input">
                <span className="dashboard-topic-prefix">{topicPrefix}</span>
                <input
                  id="rule-topic"
                  value={form.topic}
                  onChange={(event) => updateForm('topic', event.target.value)}
                  placeholder="sensors/+/humidity"
                  required
                />
              </div>
            </label>

            <p className="dashboard-topic-helper">Enter only the topic suffix after the fixed user path.</p>

            <div className="dashboard-form-actions">
              <button className="dashboard-primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingRuleId ? 'Update Rule' : 'Add Rule'}
              </button>

              {editingRuleId ? (
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
          <h3>Rules</h3>
          {isLoadingDevices ? (
            <p className="dashboard-muted">Loading devices...</p>
          ) : devices.length === 0 ? (
            <p className="dashboard-muted">Create a device first to manage ACL rules.</p>
          ) : !selectedDeviceId ? (
            <p className="dashboard-muted">Select a device to view rules.</p>
          ) : isLoadingRules ? (
            <p className="dashboard-muted">Loading rules...</p>
          ) : rules.length === 0 ? (
            <p className="dashboard-muted">No rules found for this device.</p>
          ) : (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Permission</th>
                    <th>Topic</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id}>
                      <td>{rule.id}</td>
                      <td>{rule.permission}</td>
                      <td className="dashboard-truncate">{rule.topic}</td>
                      <td>
                        <div className="dashboard-row-actions">
                          <button type="button" onClick={() => handleEdit(rule)}>
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDelete(rule.id)}>
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
