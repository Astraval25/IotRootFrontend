// One store per authenticated dashboard. Page subscriptions never own the socket.
export function createWorkspaceStore(api, openSocket) {
  let state = {
    devices: null, deviceStatuses: {}, usageSummary: null, usageByDevice: {},
    statusStream: 'connecting', lastUpdatedAt: '', error: '', refreshing: false,
    topics: null, topicsLoading: false, topicsError: '',
  }
  const listeners = new Set()
  let generation = 0
  let disconnect = null
  let workspaceRequest = null
  let topicsRequest = null
  const usageRequests = new Map()
  // Raw credentials stay in this signed-in workspace only, never in browser storage.
  const devicePasswords = new Map()
  let statusVersion = 0
  let overviewVersion = 0
  let devicesVersion = 0
  let topicsVersion = 0
  const usageVersions = new Map()
  const emit = (patch) => {
    state = { ...state, ...patch }
    listeners.forEach((listener) => listener())
  }
  const current = (run) => run === generation

  function onEvent(payload) {
    const lastUpdatedAt = new Date().toISOString()
    if (payload?.event === 'device_status_snapshot' && Array.isArray(payload.data)) {
      statusVersion += 1
      emit({ deviceStatuses: Object.fromEntries(payload.data.map(row => [String(row.deviceId), row])), lastUpdatedAt })
    } else if (payload?.event === 'usage_overview_snapshot' && payload.data) {
      overviewVersion += 1
      emit({ usageSummary: payload.data, lastUpdatedAt })
    } else if (payload?.event === 'device_usage_snapshot' && payload.data?.deviceId != null) {
      const id = String(payload.data.deviceId)
      usageVersions.set(id, (usageVersions.get(id) ?? 0) + 1)
      emit({ usageByDevice: { ...state.usageByDevice, [id]: { summary: payload.data.deviceSummary, buckets: payload.data.recentBuckets ?? [], loading: false, error: '' } }, lastUpdatedAt })
    }
  }

  function refresh() {
    if (workspaceRequest) return workspaceRequest
    const run = generation
    const statusesAtStart = statusVersion
    const overviewAtStart = overviewVersion
    const devicesAtStart = devicesVersion
    const firstDeviceLoad = state.devices === null
    emit({ refreshing: true, error: '' })
    workspaceRequest = Promise.allSettled([api.fetchDevices(), api.fetchDeviceConnectionStatus(), api.fetchUserUsageSummary()])
      .then(([devices, statuses, usage]) => {
        if (!current(run)) return
        const patch = { refreshing: false }
        if (devices.status === 'fulfilled' && devicesAtStart === devicesVersion) patch.devices = devices.value.data ?? []
        else if (devices.status === 'fulfilled' && firstDeviceLoad) {
          // A device may be created while the initial list is still loading.
          patch.devices = [...new Map([...(devices.value.data ?? []), ...(state.devices ?? [])].map(device => [String(device.id), device])).values()]
        }
        if (statuses.status === 'fulfilled' && statusesAtStart === statusVersion) patch.deviceStatuses = Object.fromEntries((statuses.value.data ?? []).map(row => [String(row.deviceId), row]))
        if (usage.status === 'fulfilled' && overviewAtStart === overviewVersion) patch.usageSummary = usage.value.data
        const failure = [devices, statuses, usage].find(result => result.status === 'rejected')
        patch.error = failure ? failure.reason.message || 'Could not refresh workspace.' : ''
        emit(patch)
      }).finally(() => { if (current(run)) workspaceRequest = null })
    return workspaceRequest
  }

  function loadTopics(force = false) {
    if (topicsRequest) return topicsRequest
    if (state.topics !== null && !force) return Promise.resolve()
    const run = generation
    const topicsAtStart = topicsVersion
    emit({ topicsLoading: true, topicsError: '' })
    topicsRequest = (async () => {
      try {
        if (state.devices === null) await refresh()
        if (!current(run)) return
        if (state.devices === null) throw new Error('Could not load devices. Try again.')
        const rows = await Promise.all(state.devices.map(async device => {
          const response = await api.fetchDeviceRules(device.id)
          return (response.data ?? []).map(rule => ({ ...rule, deviceId: device.id }))
        }))
        if (current(run) && topicsAtStart === topicsVersion) emit({ topics: rows.flat().filter(row => state.devices.some(device => String(device.id) === String(row.deviceId))) })
      } catch (error) {
        if (current(run)) emit({ topicsError: error.message || 'Could not load topics.' })
      } finally {
        if (current(run)) { topicsRequest = null; emit({ topicsLoading: false }) }
      }
    })()
    return topicsRequest
  }

  function loadUsage(deviceId) {
    const id = String(deviceId)
    if (usageRequests.has(id)) return usageRequests.get(id)
    if (state.usageByDevice[id] && !state.usageByDevice[id].loading && !state.usageByDevice[id].error) return Promise.resolve()
    const run = generation
    const version = usageVersions.get(id) ?? 0
    emit({ usageByDevice: { ...state.usageByDevice, [id]: { loading: true, error: '' } } })
    const request = Promise.all([api.fetchDeviceUsageSummary(id), api.fetchDeviceUsageBuckets(id)])
      .then(([summary, buckets]) => {
        if (current(run) && version === (usageVersions.get(id) ?? 0)) emit({ usageByDevice: { ...state.usageByDevice, [id]: { summary: summary.data, buckets: buckets.data ?? [], loading: false, error: '' } } })
      }).catch(error => {
        if (current(run) && version === (usageVersions.get(id) ?? 0)) emit({ usageByDevice: { ...state.usageByDevice, [id]: { loading: false, error: error.message || 'Could not load usage.' } } })
      }).finally(() => { if (current(run)) usageRequests.delete(id) })
    usageRequests.set(id, request)
    return request
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    start() {
      if (disconnect) return
      // Child page effects may request data before the provider effect starts.
      // Only disposal invalidates that generation, not attaching the socket.
      const run = generation
      disconnect = openSocket({ onEvent: payload => { if (current(run)) onEvent(payload) }, onStatusChange: statusStream => { if (current(run)) emit({ statusStream }) } })
      refresh()
    },
    stop() {
      generation += 1
      disconnect?.()
      disconnect = null
      workspaceRequest = null
      topicsRequest = null
      usageRequests.clear()
      devicePasswords.clear()
    },
    refresh, loadTopics, loadUsage,
    getDevicePassword(deviceId) { return devicePasswords.get(String(deviceId)) ?? '' },
    rememberDevicePassword(deviceId, password) {
      if (password) devicePasswords.set(String(deviceId), password)
      else devicePasswords.delete(String(deviceId))
    },
    upsertDevice(device) {
      devicesVersion += 1
      const exists = state.devices?.some(row => String(row.id) === String(device.id))
      emit({ devices: exists ? state.devices.map(row => String(row.id) === String(device.id) ? device : row) : [...(state.devices ?? []), device] })
    },
    removeDevice(deviceId) {
      devicesVersion += 1
      topicsVersion += 1
      const id = String(deviceId)
      devicePasswords.delete(id)
      const deviceStatuses = { ...state.deviceStatuses }
      const usageByDevice = { ...state.usageByDevice }
      delete deviceStatuses[id]
      delete usageByDevice[id]
      emit({ devices: state.devices.filter(row => String(row.id) !== id), deviceStatuses, usageByDevice, topics: state.topics?.filter(row => String(row.deviceId) !== id) ?? null })
    },
    upsertTopic(topic) {
      topicsVersion += 1
      const same = row => String(row.id) === String(topic.id) && String(row.deviceId) === String(topic.deviceId)
      const exists = state.topics?.some(same)
      emit({ topics: exists ? state.topics.map(row => same(row) ? topic : row) : [...(state.topics ?? []), topic] })
    },
    removeTopic(topic) {
      topicsVersion += 1
      emit({ topics: (state.topics ?? []).filter(row => !(String(row.id) === String(topic.id) && String(row.deviceId) === String(topic.deviceId))) })
    },
  }
}
