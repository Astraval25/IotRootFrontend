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
  return apiGet('/api/devices/usage/summary', { requiresAuth: true }).catch(async (error) => {
    if (error?.code !== 404) {
      throw error
    }

    // Backward-compatible fallback for deployments that do not expose
    // the account-level usage endpoint yet.
    const devicesResponse = await fetchDevices()
    const devices = devicesResponse.data ?? []

    if (devices.length === 0) {
      return {
        status: true,
        code: 200,
        message: 'Usage summary fetched',
        data: buildUsageSummary(),
      }
    }

    const perDeviceResponses = await Promise.all(
      devices.map((device) =>
        fetchDeviceUsageSummary(device.id).catch(() => ({
          status: true,
          code: 200,
          message: 'Device usage summary unavailable',
          data: buildUsageSummary(),
        })),
      ),
    )

    const aggregate = perDeviceResponses.reduce((summary, response) => {
      const data = response?.data ?? {}
      summary.inboundMessages += Number(data.inboundMessages ?? 0)
      summary.outboundMessages += Number(data.outboundMessages ?? 0)
      summary.inboundPayloadBytes += Number(data.inboundPayloadBytes ?? 0)
      summary.outboundPayloadBytes += Number(data.outboundPayloadBytes ?? 0)
      summary.inboundEstimatedTotalBytes += Number(data.inboundEstimatedTotalBytes ?? 0)
      summary.outboundEstimatedTotalBytes += Number(data.outboundEstimatedTotalBytes ?? 0)
      return summary
    }, buildUsageSummary())

    return {
      status: true,
      code: 200,
      message: 'Usage summary fetched',
      data: aggregate,
    }
  })
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

function buildUsageSummary() {
  return {
    deviceId: null,
    clientId: 'all',
    inboundMessages: 0,
    outboundMessages: 0,
    inboundPayloadBytes: 0,
    outboundPayloadBytes: 0,
    inboundEstimatedTotalBytes: 0,
    outboundEstimatedTotalBytes: 0,
  }
}
