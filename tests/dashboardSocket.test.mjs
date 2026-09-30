import test from 'node:test'
import assert from 'node:assert/strict'
import { openDashboardSocket } from '../src/features/dashboard/realtime/dashboardSocket.js'

test('socket reconnect uses current token, preserves lifecycle, and cancels retries on disposal', () => {
  const originalWindow = globalThis.window
  const OriginalSocket = globalThis.WebSocket
  const sockets = [], timers = new Map(), statuses = [], events = []
  let timerId = 0
  let token = 'first-token'
  globalThis.window = {
    location: { origin: 'http://localhost:5173' },
    setTimeout(fn, delay) { const id = ++timerId; timers.set(id, { fn, delay }); return id },
    clearTimeout(id) { timers.delete(id) },
  }
  globalThis.WebSocket = class {
    constructor(url) { this.url = url; sockets.push(this) }
    close() { this.closed = true; this.onclose?.() }
  }
  try {
    const stop = openDashboardSocket({ getToken: () => token, apiBaseUrl: 'https://example.test/api-root', onStatusChange: value => statuses.push(value), onEvent: value => events.push(value) })
    assert.equal(sockets.length, 1)
    assert.equal(sockets[0].url, 'wss://example.test/api-root/ws/device-status?token=first-token')
    sockets[0].onopen()
    sockets[0].onmessage({ data: '{invalid json' })
    sockets[0].onmessage({ data: JSON.stringify({ event: 'device_status_snapshot', data: [] }) })
    assert.equal(events.length, 1)
    sockets[0].onclose()
    const retry = timers.get(1)
    assert.equal(retry.delay, 1000)
    timers.delete(1)
    token = 'refreshed-token'
    retry.fn()
    assert.equal(sockets.length, 2)
    assert.match(sockets[1].url, /token=refreshed-token$/)
    sockets[1].onopen()
    sockets[1].onclose()
    assert.equal(timers.size, 1)
    stop()
    assert.equal(timers.size, 0)
    assert.equal(sockets[1].closed, true)
    const before = statuses.length
    sockets[1].onopen()
    sockets[1].onmessage({ data: '{}' })
    assert.equal(statuses.length, before)
    assert.equal(events.length, 1)
    assert.equal(statuses.filter(status => status === 'connecting').length, 1)
  } finally {
    globalThis.window = originalWindow
    globalThis.WebSocket = OriginalSocket
  }
})
