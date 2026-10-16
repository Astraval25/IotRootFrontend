import test from 'node:test'
import assert from 'node:assert/strict'
import { buildStarterSketch, escapeArduinoString, isStarterSketchReady } from '../src/features/dashboard/gettingStartedSketch.js'

const template = [
  'ssid={{WIFI_SSID}}',
  'wifi={{WIFI_PASSWORD}}',
  'host={{MQTT_HOST}}:{{MQTT_PORT}}',
  'user={{MQTT_USERNAME}}',
  'password={{MQTT_PASSWORD}}',
  'topic={{MQTT_TOPIC}}',
  'client={{MQTT_CLIENT_ID}}',
].join('\n')

test('starter sketch replaces every connection placeholder', () => {
  const configuration = {
    ssid: 'Workshop',
    wifiPassword: 'wifi-secret',
    host: 'iotroot.astraval.com',
    port: 1883,
    username: 'maker@example.com',
    mqttPassword: 'account-secret',
    topic: '/iot/store/42/temperature',
    clientId: 'generated-client-id',
  }
  const sketch = buildStarterSketch(template, configuration)

  assert.match(sketch, /ssid=Workshop/)
  assert.match(sketch, /host=iotroot\.astraval\.com:1883/)
  assert.match(sketch, /user=maker@example\.com/)
  assert.match(sketch, /password=account-secret/)
  assert.match(sketch, /topic=\/iot\/store\/42\/temperature/)
  assert.match(sketch, /client=generated-client-id/)
  assert.doesNotMatch(sketch, /{{[A-Z_]+}}/)
  assert.equal(isStarterSketchReady(configuration), true)
  assert.equal(isStarterSketchReady({ ...configuration, mqttPassword: '' }), false)
})

test('Arduino string values escape quotes and backslashes', () => {
  assert.equal(escapeArduinoString('shop\\"wifi'), 'shop\\\\\\"wifi')
})
