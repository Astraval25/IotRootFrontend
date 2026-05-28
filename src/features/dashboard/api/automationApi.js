import { apiDelete, apiGet, apiPost, apiPut } from '../../../shared/api/httpClient'

export function fetchScreens() {
  return apiGet('/api/screens', { requiresAuth: true })
}

export function fetchScreenById(screenId) {
  return apiGet(`/api/screens/${screenId}`, { requiresAuth: true })
}

export function createScreen(payload) {
  return apiPost('/api/screens', payload, { requiresAuth: true })
}

export function updateScreen(screenId, payload) {
  return apiPut(`/api/screens/${screenId}`, payload, { requiresAuth: true })
}

export function deleteScreen(screenId) {
  return apiDelete(`/api/screens/${screenId}`, { requiresAuth: true })
}

export function fetchSchedules() {
  return apiGet('/api/schedules', { requiresAuth: true })
}

export function fetchScheduleById(scheduleId) {
  return apiGet(`/api/schedules/${scheduleId}`, { requiresAuth: true })
}

export function createSchedule(payload) {
  return apiPost('/api/schedules', payload, { requiresAuth: true })
}

export function updateSchedule(scheduleId, payload) {
  return apiPut(`/api/schedules/${scheduleId}`, payload, { requiresAuth: true })
}

export function deleteSchedule(scheduleId) {
  return apiDelete(`/api/schedules/${scheduleId}`, { requiresAuth: true })
}

