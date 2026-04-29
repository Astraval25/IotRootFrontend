import { apiPost } from '../../../shared/api/httpClient'

export function createLead(payload) {
  return apiPost('/api/leads', payload)
}
