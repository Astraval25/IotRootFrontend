import test from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'
import { createWorkspaceStore } from '../src/features/dashboard/realtime/workspaceStore.js'

test('device-first Topics page and permission-specific command views render correctly', async t => {
  const vite = await createServer({ root: fileURLToPath(new URL('..', import.meta.url)), server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  t.after(() => vite.close())
  const { DashboardTopicsPage } = await vite.ssrLoadModule('/src/features/dashboard/pages/DashboardTopicsPage.jsx')
  const { TopicCommands } = await vite.ssrLoadModule('/src/features/dashboard/components/TopicCommands.jsx')
  const { WorkspaceContext } = await vite.ssrLoadModule('/src/features/dashboard/realtime/useWorkspace.js')
  const store = createWorkspaceStore({}, () => () => {})
  const kitchen = { id: 1, username: 'Kitchen', clientId: 'client-1' }
  store.upsertDevice(kitchen)
  store.upsertDevice({ id: 2, username: 'Garden', clientId: 'client-2' })
  store.upsertDevice({ id: 3, username: 'No topics device', clientId: 'client-3' })
  store.upsertTopic({ id: 1, deviceId: 1, topic: '/iot/7/kitchen-temperature', permission: 'publish' })
  store.upsertTopic({ id: 2, deviceId: 1, topic: '/iot/7/kitchen-light', permission: 'subscribe' })
  store.upsertTopic({ id: 3, deviceId: 2, topic: '/iot/7/garden', permission: 'subscribe' })
  const render = (component, url = '/iotroot/dashboard/topics') => renderToStaticMarkup(createElement(WorkspaceContext.Provider, { value: store }, createElement(MemoryRouter, { initialEntries: [url] }, component)))
  const overview = render(createElement(DashboardTopicsPage))
  assert.match(overview, /Kitchen/)
  assert.match(overview, /Garden/)
  assert.match(overview, /No topics device/)
  assert.match(overview, /workspace-topic-count">2</)
  assert.match(overview, /workspace-topic-count">0</)
  assert.doesNotMatch(overview, /kitchen-temperature/)

  const devicePage = render(createElement(DashboardTopicsPage), '/iotroot/dashboard/topics?device=1')
  assert.match(devicePage, /kitchen-temperature/)
  assert.match(devicePage, /kitchen-light/)
  assert.doesNotMatch(devicePage, /\/iot\/7\/garden/)
  assert.match(devicePage, /Add topic/)
  const filtered = render(createElement(DashboardTopicsPage), '/iotroot/dashboard/topics?device=1&permission=subscribe')
  assert.match(filtered, /kitchen-light/)
  assert.doesNotMatch(filtered, /kitchen-temperature/)

  const previousWindow = globalThis.window
  globalThis.window = { location: { origin: 'http://localhost' } }
  try {
    store.rememberDevicePassword(1, 'entered-secret')
    const publish = render(createElement(TopicCommands, { device: kitchen, topic: { topic: '/iot/7/test', permission: 'publish' } }))
    assert.match(publish, /mosquitto_pub/)
    assert.match(publish, /entered-secret/)
    assert.match(publish, /Copy publish/)
    assert.doesNotMatch(publish, /mosquitto_sub/)
    const subscribe = render(createElement(TopicCommands, { device: kitchen, topic: { topic: '/iot/7/test', permission: 'subscribe' } }))
    assert.match(subscribe, /mosquitto_sub/)
    assert.doesNotMatch(subscribe, /mosquitto_pub/)
    store.rememberDevicePassword(1, '')
    const noPassword = render(createElement(TopicCommands, { device: kitchen, topic: { topic: '/iot/7/test', permission: 'publish' } }))
    assert.match(noPassword, /Enter the password once/)
    assert.doesNotMatch(noPassword, /mosquitto_pub/)
  } finally { globalThis.window = previousWindow }
})
