export function deviceStatus(status) {
  return typeof status?.connected !== 'boolean' ? 'unknown' : status.connected ? 'connected' : 'disconnected'
}

export function countTopicsByDevice(topics) {
  return topics.reduce((counts, topic) => {
    const id = String(topic.deviceId)
    counts[id] = (counts[id] ?? 0) + 1
    return counts
  }, {})
}

export function filterDevices(devices, statuses, { search = '', status = '' }) {
  const term = search.trim().toLowerCase()
  return devices.filter(device => (!status || deviceStatus(statuses[String(device.id)]) === status) &&
    [device.username, device.clientId, device.mountpoint, device.id].some(value => String(value ?? '').toLowerCase().includes(term)))
}

export function filterTopics(topics, devices, { search = '', deviceId = '', permission = '' }) {
  const names = new Map(devices.map(device => [String(device.id), device.username]))
  const term = search.trim().toLowerCase()
  return topics.filter(topic => (!deviceId || String(topic.deviceId) === deviceId) && (!permission || topic.permission === permission) &&
    [topic.topic, names.get(String(topic.deviceId))].some(value => String(value ?? '').toLowerCase().includes(term)))
}
