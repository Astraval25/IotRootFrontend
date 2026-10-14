import { apiDelete, apiGet, apiPost } from '../../../shared/api/httpClient'

export function fetchStoredMessages(filters = {}) {
  const query = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.set(key, value)
  })
  const suffix = query.size ? `?${query.toString()}` : ''
  return apiGet(`/api/store/messages${suffix}`, { requiresAuth: true })
}

export function fetchApiKeys() {
  return apiGet('/api/api-keys', { requiresAuth: true })
}

export function createApiKey(name) {
  return apiPost('/api/api-keys', { name }, { requiresAuth: true })
}

export function revokeApiKey(id) {
  return apiDelete(`/api/api-keys/${id}`, { requiresAuth: true })
}
