import { useEffect, useMemo, useState } from 'react'
import {
  createSchedule,
  deleteSchedule,
  fetchScheduleById,
  fetchSchedules,
  fetchScreens,
  updateSchedule,
} from '../api/automationApi'
import { getCurrentUserId } from '../../auth/session/authSession'

const daysOfWeekOptions = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]

const initialForm = {
  name: '',
  startAt: '',
  endAt: '',
  recurrenceType: 'ONCE',
  intervalCount: 1,
  daysOfWeek: [],
  dayOfMonth: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  screenId: '',
  targetTopic: '',
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

function toLocalInputValue(value) {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const pad = (part) => String(part).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hour = pad(date.getHours())
  const minute = pad(date.getMinutes())
  return `${year}-${month}-${day}T${hour}:${minute}`
}

function toIsoString(localInputValue) {
  if (!localInputValue) {
    return null
  }
  const date = new Date(localInputValue)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date.toISOString()
}

function formatDateTime(value) {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export function DashboardSchedulesPage() {
  const [schedules, setSchedules] = useState([])
  const [screens, setScreens] = useState([])
  const [form, setForm] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const userId = getCurrentUserId()
  const topicPrefix = getTopicPrefix(userId)

  const needsWeeklyDays = form.recurrenceType === 'WEEKLY'
  const needsDayOfMonth = form.recurrenceType === 'MONTHLY'

  const selectedScreen = useMemo(
    () => screens.find((screen) => String(screen.id) === String(form.screenId)) ?? null,
    [screens, form.screenId],
  )

  useEffect(() => {
    let isDisposed = false

    async function loadData() {
      try {
        const [scheduleResponse, screenResponse] = await Promise.all([fetchSchedules(), fetchScreens()])
        if (isDisposed) {
          return
        }
        setSchedules(scheduleResponse.data ?? [])
        setScreens(screenResponse.data ?? [])
      } catch (error) {
        if (!isDisposed) {
          setErrorMessage(error.message || 'Failed to load schedules.')
        }
      } finally {
        if (!isDisposed) {
          setIsLoading(false)
        }
      }
    }

    loadData()

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

  async function reloadData() {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const [scheduleResponse, screenResponse] = await Promise.all([fetchSchedules(), fetchScreens()])
      setSchedules(scheduleResponse.data ?? [])
      setScreens(screenResponse.data ?? [])
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load schedules.')
      setSchedules([])
    } finally {
      setIsLoading(false)
    }
  }

  function toggleDay(day) {
    setForm((previous) => {
      const exists = previous.daysOfWeek.includes(day)
      return {
        ...previous,
        daysOfWeek: exists
          ? previous.daysOfWeek.filter((item) => item !== day)
          : [...previous.daysOfWeek, day],
      }
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setErrorMessage('')

    const startAt = toIsoString(form.startAt)
    const endAt = toIsoString(form.endAt)
    if (!startAt) {
      setErrorMessage('Start date and time is required.')
      return
    }
    if (!form.screenId && !normalizeTopicInput(form.targetTopic)) {
      setErrorMessage('Choose a screen or enter a target topic.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        startAt,
        endAt,
        recurrenceType: form.recurrenceType,
        intervalCount: Number(form.intervalCount) || 1,
        daysOfWeek: needsWeeklyDays ? form.daysOfWeek : null,
        dayOfMonth: needsDayOfMonth ? Number(form.dayOfMonth) || null : null,
        timezone: form.timezone.trim() || 'UTC',
        screenId: form.screenId ? Number(form.screenId) : null,
        targetTopic: normalizeTopicInput(form.targetTopic) || null,
        payload: form.payload.trim() || null,
        active: Boolean(form.active),
      }

      if (editingId) {
        const response = await updateSchedule(editingId, payload)
        setMessage(response.message || 'Schedule updated.')
      } else {
        const response = await createSchedule(payload)
        setMessage(response.message || 'Schedule created.')
      }

      resetForm()
      await reloadData()
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save schedule.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleEdit(scheduleId) {
    setMessage('')
    setErrorMessage('')

    try {
      const response = await fetchScheduleById(scheduleId)
      const schedule = response.data
      setEditingId(schedule.id)
      setForm({
        name: schedule.name || '',
        startAt: toLocalInputValue(schedule.startAt),
        endAt: toLocalInputValue(schedule.endAt),
        recurrenceType: schedule.recurrenceType || 'ONCE',
        intervalCount: schedule.intervalCount || 1,
        daysOfWeek: schedule.daysOfWeek || [],
        dayOfMonth: schedule.dayOfMonth || '',
        timezone: schedule.timezone || 'UTC',
        screenId: schedule.screenId ? String(schedule.screenId) : '',
        targetTopic: stripTopicPrefix(schedule.targetTopic, userId),
        payload: schedule.payload || '',
        active: schedule.active ?? true,
      })
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load schedule details.')
    }
  }

  async function handleDelete(scheduleId) {
    setMessage('')
    setErrorMessage('')
    try {
      const response = await deleteSchedule(scheduleId)
      setMessage(response.message || 'Schedule deleted.')
      if (editingId === scheduleId) {
        resetForm()
      }
      await reloadData()
    } catch (error) {
      setErrorMessage(error.message || 'Failed to delete schedule.')
    }
  }

  return (
    <section className="dashboard-section">
      <header className="dashboard-section-header">
        <div>
          <h2>Task Schedules</h2>
          <p>Set one-time and repetitive tasks with timezone support.</p>
        </div>

        <button className="dashboard-secondary-button" type="button" onClick={reloadData} disabled={isLoading}>
          Refresh
        </button>
      </header>

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <h3>{editingId ? `Edit Schedule #${editingId}` : 'Create Schedule'}</h3>
          <form className="dashboard-form" onSubmit={handleSubmit}>
            <label htmlFor="schedule-name">
              Name
              <input
                id="schedule-name"
                value={form.name}
                onChange={(event) => updateForm('name', event.target.value)}
                placeholder="Morning Fan Run"
                required
              />
            </label>

            <label htmlFor="schedule-start">
              Start At
              <input
                id="schedule-start"
                type="datetime-local"
                value={form.startAt}
                onChange={(event) => updateForm('startAt', event.target.value)}
                required
              />
            </label>

            <label htmlFor="schedule-end">
              End At (Optional)
              <input
                id="schedule-end"
                type="datetime-local"
                value={form.endAt}
                onChange={(event) => updateForm('endAt', event.target.value)}
              />
            </label>

            <label htmlFor="schedule-recurrence">
              Recurrence Type
              <select
                id="schedule-recurrence"
                value={form.recurrenceType}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setForm((previous) => ({
                    ...previous,
                    recurrenceType: nextValue,
                    daysOfWeek: nextValue === 'WEEKLY' ? previous.daysOfWeek : [],
                    dayOfMonth: nextValue === 'MONTHLY' ? previous.dayOfMonth : '',
                  }))
                }}
              >
                <option value="ONCE">ONCE</option>
                <option value="DAILY">DAILY</option>
                <option value="WEEKLY">WEEKLY</option>
                <option value="MONTHLY">MONTHLY</option>
              </select>
            </label>

            <label htmlFor="schedule-interval">
              Interval Count
              <input
                id="schedule-interval"
                type="number"
                min="1"
                value={form.intervalCount}
                onChange={(event) => updateForm('intervalCount', event.target.value)}
              />
            </label>

            {needsWeeklyDays ? (
              <fieldset>
                <legend>Days of Week</legend>
                <div className="dashboard-row-actions">
                  {daysOfWeekOptions.map((day) => (
                    <label key={day} className="dashboard-inline-action">
                      <input
                        type="checkbox"
                        checked={form.daysOfWeek.includes(day)}
                        onChange={() => toggleDay(day)}
                      />
                      {day.slice(0, 3)}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {needsDayOfMonth ? (
              <label htmlFor="schedule-day-of-month">
                Day of Month
                <input
                  id="schedule-day-of-month"
                  type="number"
                  min="1"
                  max="31"
                  value={form.dayOfMonth}
                  onChange={(event) => updateForm('dayOfMonth', event.target.value)}
                  required
                />
              </label>
            ) : null}

            <label htmlFor="schedule-timezone">
              Timezone
              <input
                id="schedule-timezone"
                value={form.timezone}
                onChange={(event) => updateForm('timezone', event.target.value)}
                placeholder="Asia/Kolkata"
                required
              />
            </label>

            <label htmlFor="schedule-screen">
              Screen (Optional)
              <select
                id="schedule-screen"
                value={form.screenId}
                onChange={(event) => updateForm('screenId', event.target.value)}
              >
                <option value="">No linked screen</option>
                {screens.map((screen) => (
                  <option key={screen.id} value={screen.id}>
                    #{screen.id} {screen.name}
                  </option>
                ))}
              </select>
            </label>

            <label htmlFor="schedule-topic">
              Target Topic (Optional)
              <div className="dashboard-topic-input">
                <span className="dashboard-topic-prefix">{topicPrefix}</span>
                <input
                  id="schedule-topic"
                  value={form.targetTopic}
                  onChange={(event) => updateForm('targetTopic', event.target.value)}
                  placeholder="actuators/room1/fan/set"
                />
              </div>
            </label>

            <label htmlFor="schedule-payload">
              Payload
              <textarea
                id="schedule-payload"
                rows={4}
                value={form.payload}
                onChange={(event) => updateForm('payload', event.target.value)}
                placeholder={selectedScreen?.payload || '{"state":"on"}'}
              />
            </label>

            <label htmlFor="schedule-active">
              Status
              <select
                id="schedule-active"
                value={String(form.active)}
                onChange={(event) => updateForm('active', event.target.value === 'true')}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>

            <div className="dashboard-form-actions">
              <button className="dashboard-primary-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingId ? 'Update Schedule' : 'Create Schedule'}
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
          <h3>Created Schedules</h3>
          {isLoading ? (
            <p className="dashboard-muted">Loading schedules...</p>
          ) : schedules.length === 0 ? (
            <p className="dashboard-muted">No schedules created yet.</p>
          ) : (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Recurrence</th>
                    <th>Status</th>
                    <th>Start</th>
                    <th>Next Run</th>
                    <th>Target</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((schedule) => (
                    <tr key={schedule.id}>
                      <td>{schedule.id}</td>
                      <td>{schedule.name || '-'}</td>
                      <td>{schedule.recurrenceType || '-'}</td>
                      <td>{schedule.active ? 'Active' : 'Inactive'}</td>
                      <td>{formatDateTime(schedule.startAt)}</td>
                      <td>{formatDateTime(schedule.nextRunAt)}</td>
                      <td className="dashboard-truncate">
                        {schedule.targetTopic || (schedule.screenId ? `Screen #${schedule.screenId}` : '-')}
                      </td>
                      <td>
                        <div className="dashboard-row-actions">
                          <button type="button" onClick={() => handleEdit(schedule.id)}>
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDelete(schedule.id)}>
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

