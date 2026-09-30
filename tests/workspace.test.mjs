import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorkspaceStore } from '../src/features/dashboard/realtime/workspaceStore.js'
import { filterDevices, filterTopics, deviceStatus } from '../src/features/dashboard/workspaceFilters.js'

const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function fixture(overrides = {}) {
  const calls = { sockets: 0, closes: 0, devices: 0, rules: 0, usage: 0 }
  let events
  const api = {
    async fetchDevices() { calls.devices++; return { data: [{ id: 1, username: 'Kitchen' }, { id: 2, username: 'Garden' }] } },
    async fetchDeviceConnectionStatus() { return { data: [{ deviceId: 1, connected: false }] } },
    async fetchUserUsageSummary() { return { data: { inboundMessages: 1 } } },
    async fetchDeviceRules(id) { calls.rules++; return { data: [{ id: 10, deviceId: id, topic: `/iot/7/device-${id}`, permission: id === 1 ? 'publish' : 'subscribe' }] } },
    async fetchDeviceUsageSummary(id) { calls.usage++; return { data: { deviceId: id, inboundMessages: 1 } } },
    async fetchDeviceUsageBuckets() { return { data: [] } },
    ...overrides,
  }
  const store = createWorkspaceStore(api, callbacks => { calls.sockets++; events = callbacks; return () => { calls.closes++ } })
  return { store, calls, get events() { return events } }
}

test('page subscriptions and device selection reuse one live connection and cached data', async () => {
  const f = fixture()
  f.store.start()
  await f.store.refresh()
  f.events.onStatusChange('connected')
  const leaveOverview = f.store.subscribe(() => {})
  leaveOverview()
  const leaveDevices = f.store.subscribe(() => {})
  await f.store.loadUsage(1)
  await f.store.loadUsage(2)
  leaveDevices()
  const leaveTopics = f.store.subscribe(() => {})
  await f.store.loadTopics()
  await f.store.loadTopics()
  await f.store.loadUsage(1)
  f.store.start()
  assert.equal(f.calls.sockets, 1)
  assert.equal(f.calls.closes, 0)
  assert.equal(f.calls.devices, 1)
  assert.equal(f.calls.rules, 2)
  assert.equal(f.calls.usage, 2)
  assert.equal(f.store.getSnapshot().statusStream, 'connected')
  assert.equal(f.store.getSnapshot().topics.length, 2)
  leaveTopics()
  f.store.stop()
  assert.equal(f.calls.closes, 1)
})

test('direct Topics entry can request data before the provider attaches the socket', async () => {
  const f = fixture()
  const pendingTopics = f.store.loadTopics()
  f.store.start()
  await pendingTopics
  assert.equal(f.store.getSnapshot().topics.length, 2)
  assert.equal(f.store.getSnapshot().topicsLoading, false)
  assert.equal(f.calls.devices, 1)
  f.store.stop()
})

test('effect cleanup and restart ignore old requests and complete the new generation', async () => {
  const first = deferred()
  let calls = 0
  const f = fixture({ fetchDevices() { return ++calls === 1 ? first.promise : Promise.resolve({ data: [{ id: 2, username: 'Current' }] }) } })
  f.store.loadTopics()
  f.store.start()
  f.store.stop()
  const second = f.store.loadTopics()
  f.store.start()
  first.resolve({ data: [{ id: 1, username: 'Stale' }] })
  await second
  assert.deepEqual(f.store.getSnapshot().devices, [{ id: 2, username: 'Current' }])
  assert.equal(f.store.getSnapshot().topics.length, 1)
  assert.equal(f.store.getSnapshot().topics[0].deviceId, 2)
  assert.equal(f.store.getSnapshot().topicsLoading, false)
  f.store.stop()
})

test('late REST snapshots cannot overwrite newer live status or usage', async () => {
  const statuses = deferred(), usage = deferred(), deviceUsage = deferred()
  const f = fixture({ fetchDeviceConnectionStatus: () => statuses.promise, fetchUserUsageSummary: () => usage.promise, fetchDeviceUsageSummary: () => deviceUsage.promise })
  f.store.start()
  const loading = f.store.refresh()
  const details = f.store.loadUsage(1)
  f.events.onEvent({ event: 'device_status_snapshot', data: [{ deviceId: 1, connected: true }] })
  f.events.onEvent({ event: 'usage_overview_snapshot', data: { inboundMessages: 50 } })
  f.events.onEvent({ event: 'device_usage_snapshot', data: { deviceId: 1, deviceSummary: { inboundMessages: 25 }, recentBuckets: [] } })
  statuses.resolve({ data: [{ deviceId: 1, connected: false }] })
  usage.resolve({ data: { inboundMessages: 1 } })
  deviceUsage.resolve({ data: { inboundMessages: 1 } })
  await Promise.all([loading, details])
  const state = f.store.getSnapshot()
  assert.equal(state.deviceStatuses['1'].connected, true)
  assert.equal(state.usageSummary.inboundMessages, 50)
  assert.equal(state.usageByDevice['1'].summary.inboundMessages, 25)
  f.store.stop()
})

test('reconnect retains rows and logout ignores late socket events and requests', async () => {
  const f = fixture()
  f.store.start()
  await f.store.refresh()
  f.events.onStatusChange('reconnecting')
  assert.equal(f.store.getSnapshot().devices.length, 2)
  const oldEvents = f.events
  f.store.stop()
  const snapshot = f.store.getSnapshot()
  oldEvents.onEvent({ event: 'device_status_snapshot', data: [] })
  assert.equal(f.store.getSnapshot(), snapshot)
  const freshAccount = fixture()
  assert.equal(freshAccount.store.getSnapshot().devices, null)
})

test('all-device topic list fails explicitly and retries without displaying partial data', async () => {
  let fail = true
  const f = fixture({ async fetchDeviceRules(id) { if (fail && id === 2) throw new Error('Device rules unavailable'); return { data: [{ id, deviceId: id, topic: 'sensor' }] } } })
  f.store.start()
  await f.store.loadTopics()
  assert.equal(f.store.getSnapshot().topics, null)
  assert.equal(f.store.getSnapshot().topicsError, 'Device rules unavailable')
  fail = false
  await f.store.loadTopics(true)
  assert.equal(f.store.getSnapshot().topics.length, 2)
  assert.equal(f.store.getSnapshot().topicsError, '')
  f.store.stop()
})

test('device and topic mutations update shared lists without restarting the stream', async () => {
  const f = fixture()
  f.store.start()
  await f.store.loadTopics()
  f.store.upsertDevice({ id: 1, username: 'Renamed' })
  f.store.upsertTopic({ id: 10, deviceId: 1, topic: 'updated', permission: 'readwrite' })
  assert.equal(f.store.getSnapshot().topics.length, 2)
  assert.equal(f.store.getSnapshot().topics[0].topic, 'updated')
  f.store.removeTopic({ id: 10, deviceId: 2 })
  assert.equal(f.store.getSnapshot().topics.length, 1)
  f.store.removeDevice(1)
  assert.equal(f.store.getSnapshot().topics.length, 0)
  assert.equal(f.store.getSnapshot().devices.length, 1)
  assert.equal(f.calls.sockets, 1)
  f.store.stop()
})

test('creating a device during initial loading preserves both existing and new devices', async () => {
  const response = deferred()
  const f = fixture({ fetchDevices: () => response.promise })
  f.store.start()
  const pending = f.store.refresh()
  f.store.upsertDevice({ id: 3, username: 'New device' })
  response.resolve({ data: [{ id: 1, username: 'Existing device' }] })
  await pending
  assert.deepEqual(f.store.getSnapshot().devices.map(device => device.id), [1, 3])
  f.store.stop()
})

test('filters combine device, permission, status and case-insensitive search', () => {
  const devices = [{ id: 1, username: 'Kitchen', clientId: 'abc' }, { id: 2, username: 'Garden', clientId: 'xyz' }]
  const statuses = { 1: { connected: true } }
  const topics = [{ id: 1, deviceId: 1, topic: '/iot/7/temp', permission: 'publish' }, { id: 2, deviceId: 2, topic: '/iot/7/temp', permission: 'subscribe' }]
  assert.deepEqual(filterDevices(devices, statuses, { search: 'ABC', status: 'connected' }), [devices[0]])
  assert.deepEqual(filterDevices(devices, statuses, { status: 'unknown' }), [devices[1]])
  assert.equal(deviceStatus(undefined), 'unknown')
  assert.deepEqual(filterTopics(topics, devices, { search: 'GARDEN', deviceId: '2', permission: 'subscribe' }), [topics[1]])
  assert.equal(filterTopics(topics, devices, { deviceId: '1', permission: 'subscribe' }).length, 0)
})
