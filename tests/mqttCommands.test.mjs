import test from 'node:test'
import assert from 'node:assert/strict'
import { buildTopicCommands, matchesTopicFilter, quoteShellArgument } from '../src/features/dashboard/mqttCommands.js'
import { countTopicsByDevice } from '../src/features/dashboard/workspaceFilters.js'

const options = {
  device: { id: 7, username: 'kitchen', clientId: 'client-7' },
  rule: { topic: '/iot/1/temperature', permission: 'readwrite' },
  host: 'broker.example.test', port: 1883, password: 'device secret',
}

test('permissions produce only the allowed publish or subscribe commands', () => {
  assert.deepEqual(buildTopicCommands(options).map(item => item.kind), ['publish', 'subscribe'])
  assert.deepEqual(buildTopicCommands({ ...options, rule: { ...options.rule, permission: 'publish' } }).map(item => item.kind), ['publish'])
  assert.deepEqual(buildTopicCommands({ ...options, rule: { ...options.rule, permission: 'subscribe' } }).map(item => item.kind), ['subscribe'])
  assert.deepEqual(buildTopicCommands({ ...options, rule: { ...options.rule, permission: 'unknown' } }), [])
})

test('commands include actual credentials, exact topic, broker and configured client ID', () => {
  const commands = buildTopicCommands(options)
  assert.equal(commands[0].command, "mosquitto_pub -h 'broker.example.test' -p 1883 -u 'kitchen' -P 'device secret' -i 'client-7' -t '/iot/1/temperature' -m 'hello' -q 1")
  assert.equal(commands[1].command, "mosquitto_sub -h 'broker.example.test' -p 1883 -u 'kitchen' -P 'device secret' -i 'client-7' -t '/iot/1/temperature' -q 1 -v")
  assert.deepEqual(buildTopicCommands({ ...options, password: '' }), [])
  assert.deepEqual(buildTopicCommands({ ...options, port: '1883; bad' }), [])
  assert.deepEqual(buildTopicCommands({ ...options, device: { username: 'kitchen' } }), [])
})

test('shell quotes preserve apostrophes and shell metacharacters as literal credentials', () => {
  assert.equal(quoteShellArgument("don't $expand `this`; & run"), "'don'\\''t $expand `this`; & run'")
  assert.equal(quoteShellArgument("don't $expand `this`; & run", 'powershell'), "'don''t $expand `this`; & run'")
  assert.equal(quoteShellArgument('space "quote" \\ path'), "'space \"quote\" \\ path'")
})

test('wildcard rules keep subscribe filter but require a matching concrete publish topic', () => {
  const rule = { topic: '/iot/1/+/temperature', permission: 'readwrite' }
  assert.deepEqual(buildTopicCommands({ ...options, rule }).map(item => item.kind), ['subscribe'])
  assert.deepEqual(buildTopicCommands({ ...options, rule, publishTopic: '/iot/1/kitchen/temperature' }).map(item => item.kind), ['publish', 'subscribe'])
  assert.deepEqual(buildTopicCommands({ ...options, rule, publishTopic: '/iot/2/kitchen/temperature' }).map(item => item.kind), ['subscribe'])
  assert.equal(matchesTopicFilter('/iot/1/#', '/iot/1'), true)
  assert.equal(matchesTopicFilter('/iot/1/#', '/iot/1/a/b'), true)
  assert.equal(matchesTopicFilter('/iot/1/+', '/iot/1/a/b'), false)
  assert.equal(matchesTopicFilter('/iot/1/#', '/iot/1/+'), false)
  assert.equal(matchesTopicFilter('#', '$SYS/status'), false)
})

test('topic counts stay separate for devices sharing a topic name', () => {
  assert.deepEqual(countTopicsByDevice([{ deviceId: 1, topic: 'a' }, { deviceId: 1, topic: 'b' }, { deviceId: 2, topic: 'a' }]), { 1: 2, 2: 1 })
  assert.deepEqual(countTopicsByDevice([]), {})
})
