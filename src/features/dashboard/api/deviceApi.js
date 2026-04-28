import { apiDelete, apiGet, apiPost, apiPut } from '../../../shared/api/httpClient'

export function fetchDevices() {
  return apiGet('/api/devices', { requiresAuth: true })
}

export function fetchDeviceById(deviceId) {
  return apiGet(`/api/devices/${deviceId}`, { requiresAuth: true })
}

export function fetchDeviceConnectionStatus() {
  return apiGet('/api/devices/connection-status', { requiresAuth: true })
}

export function fetchDeviceUsageSummary(deviceId) {
  return apiGet(`/api/devices/${deviceId}/usage/summary`, { requiresAuth: true })
}

export function fetchUserUsageSummary() {
  return apiGet('/api/devices/usage/summary', { requiresAuth: true })
}

export function fetchDeviceUsageBuckets(deviceId) {
  return apiGet(`/api/devices/${deviceId}/usage/buckets`, { requiresAuth: true })
}

export function createDevice(payload) {
  return apiPost('/api/devices', payload, { requiresAuth: true })
}

export function updateDevice(deviceId, payload) {
  return apiPut(`/api/devices/${deviceId}`, payload, { requiresAuth: true })
}

export function deleteDevice(deviceId) {
  return apiDelete(`/api/devices/${deviceId}`, { requiresAuth: true })
}

export function fetchDeviceRules(deviceId) {
  return apiGet(`/api/devices/${deviceId}/rules`, { requiresAuth: true })
}

export function createDeviceRule(deviceId, payload) {
  return apiPost(`/api/devices/${deviceId}/rules`, payload, { requiresAuth: true })
}

export function updateDeviceRule(deviceId, ruleId, payload) {
  return apiPut(`/api/devices/${deviceId}/rules/${ruleId}`, payload, { requiresAuth: true })
}

export function deleteDeviceRule(deviceId, ruleId) {
  return apiDelete(`/api/devices/${deviceId}/rules/${ruleId}`, { requiresAuth: true })
}
