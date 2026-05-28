import { useEffect, useState } from 'react'
import {
  createScreen,
  deleteScreen,
  fetchScreenById,
  fetchScreens,
  updateScreen,
} from '../api/automationApi'
import { getCurrentUserId } from '../../auth/session/authSession'

const initialForm = {
  name: '',
  triggerTopic: '',
  targetTopic: '',
  actionType: 'CONTROL',
  payload: '',
  active: true,
}

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

export function DashboardScreensPage() {
  const [screens, setScreens] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const userId = getCurrentUserId()
  const topicPrefix = getTopicPrefix(userId)

  useEffect(() => {
    let isDisposed = false

    async function loadScreens() {
      try {
        const response = await fetchScreens()
        if (!isDisposed) {
          setScreens(response.data ?? [])
        }
      } catch (error) {
        if (!isDisposed) {
          setErrorMessage(error.message || 'Failed to load screens.')
        }
      } finally {
        if (!isDisposed) {
          setIsLoading(false)
        }
      }
    }

    loadScreens()

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

  async function reloadScreens() {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const response = await fetchScreens()
      setScreens(response.data ?? [])
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load screens.')
      setScreens([])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')

    const triggerTopic = normalizeTopicInput(form.triggerTopic)
    const targetTopic = normalizeTopicInput(form.targetTopic)
    if (!triggerTopic || !targetTopic) {
      setErrorMessage('Trigger topic and target topic are required.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        triggerTopic,
        targetTopic,
        actionType: form.actionType,
        payload: form.payload.trim() || null,
        active: Boolean(form.active),
      }

      if (editingId) {
        const response = await updateScreen(editingId, payload)
        setMessage(response.message || 'Screen updated.')
      } else {
        const response = await createScreen(payload)
        setMessage(response.message || 'Screen created.')
      }

      resetForm()
      await reloadScreens()
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save screen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEdit(screenId) {
    setMessage('')
    setErrorMessage('')

    try {
      const response = await fetchScreenById(screenId)
      const screen = response.data
      setEditingId(screen.id)
      setForm({
        name: screen.name || '',
        triggerTopic: stripTopicPrefix(screen.triggerTopic, userId),
        targetTopic: stripTopicPrefix(screen.targetTopic, userId),
        actionType: screen.actionType || 'CONTROL',
        payload: screen.payload || '',
        active: screen.active ?? true,
      })
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load screen details.')
    }
  }

  async function handleDelete(screenId) {
    setMessage('')
    setErrorMessage('')
    try {
      const response = await deleteScreen(screenId)
      setMessage(response.message || 'Screen deleted.')
      if (editingId === screenId) {
        resetForm()
      }
      await reloadScreens()
    } catch (error) {
      setErrorMessage(error.message || 'Failed to delete screen.')
    }
  }

  return (
    <section className="dashboard-section">
      <header className="dashboard-section-header">
        <div>
          <h2>Screens Automation</h2>
          <p>Create topic-to-topic mappings for control and message routing.</p>
        </div>

        <button className="dashboard-secondary-button" type="button" onClick={reloadScreens} disabled={isLoading}>
          Refresh
        </button>
      </header>

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <h3>{editingId ? `Edit Screen #${editingId}` : 'Create Screen'}</h3>
          <form className="dashboard-form" onSubmit={handleSubmit}>
            <label htmlFor="screen-name">
              Name
              <input
                id="screen-name"
                value={form.name}
                onChange={(event) => updateForm('name', event.target.value)}
                placeholder="Room Fan Controller"
                required
              />
            </label>

            <label htmlFor="screen-trigger-topic">
              Trigger Topic
              <div className="dashboard-topic-input">
                <span className="dashboard-topic-prefix">{topicPrefix}</span>
                <input
                  id="screen-trigger-topic"
                  value={form.triggerTopic}
                  onChange={(event) => updateForm('triggerTopic', event.target.value)}
                  placeholder="sensors/room1/temp"
                  required
                />
              </div>
            </label>

            <label htmlFor="screen-target-topic">
              Target Topic
              <div className="dashboard-topic-input">
                <span className="dashboard-topic-prefix">{topicPrefix}</span>
                <input
                  id="screen-target-topic"
                  value={form.targetTopic}
                  onChange={(event) => updateForm('targetTopic', event.target.value)}
                  placeholder="actuators/room1/fan/set"
                  required
                />
              </div>
            </label>

            <label htmlFor="screen-action-type">
              Action Type
              <select
                id="screen-action-type"
                value={form.actionType}
                onChange={(event) => updateForm('actionType', event.target.value)}
              >
                <option value="CONTROL">CONTROL</option>
                <option value="MESSAGE">MESSAGE</option>
              </select>
            </label>

            <label htmlFor="screen-payload">
              Payload
              <textarea
                id="screen-payload"
                rows={4}
                value={form.payload}
                onChange={(event) => updateForm('payload', event.target.value)}
                placeholder='{"state":"on"}'
              />
            </label>

            <label htmlFor="screen-active">
              Status
              <select
                id="screen-active"
                value={String(form.active)}
                onChange={(event) => updateForm('active', event.target.value === 'true')}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>

            <div className="dashboard-form-actions">
              <button className="dashboard-primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingId ? 'Update Screen' : 'Create Screen'}
              </button>
              {editingId ? (
                <button className="dashboard-secondary-button" type="button" onClick={resetForm} disabled={isSubmitting}>
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>

          {errorMessage ? <p className="dashboard-message dashboard-message-error">{errorMessage}</p> : null}
          {message ? <p className="dashboard-message dashboard-message-success">{message}</p> : null}
        </article>

        <article className="dashboard-card">
          <h3>Created Screens</h3>
          {isLoading ? (
            <p className="dashboard-muted">Loading screens...</p>
          ) : screens.length === 0 ? (
            <p className="dashboard-muted">No screens created yet.</p>
          ) : (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Trigger Topic</th>
                    <th>Target Topic</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {screens.map((screen) => (
                    <tr key={screen.id}>
                      <td>{screen.id}</td>
                      <td>{screen.name || '-'}</td>
                      <td>{screen.actionType || '-'}</td>
                      <td>{screen.active ? 'Active' : 'Inactive'}</td>
                      <td className="dashboard-truncate">{screen.triggerTopic || '-'}</td>
                      <td className="dashboard-truncate">{screen.targetTopic || '-'}</td>
                      <td>
                        <div className="dashboard-row-actions">
                          <button type="button" onClick={() => handleEdit(screen.id)}>
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDelete(screen.id)}>
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

