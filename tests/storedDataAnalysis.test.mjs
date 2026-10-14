import test from 'node:test'
import assert from 'node:assert/strict'
import { analyzeStoredMessages, buildTopicDataQuery, filterMessagesForTopic } from '../src/features/dashboard/storedDataAnalysis.js'

test('topic data queries use exact topics and safe prefixes for wildcard rules', () => {
  assert.deepEqual(buildTopicDataQuery('/iot/store/4/status'), { topic: '/iot/store/4/status' })
  assert.deepEqual(buildTopicDataQuery('/iot/store/4/#'), { topicPrefix: '/iot/store/4/' })
  assert.deepEqual(buildTopicDataQuery('/iot/store/4/+/status'), { topicPrefix: '/iot/store/4/' })

  const messages = [
    { topic: '/iot/store/4/a/status' },
    { topic: '/iot/store/4/a/value' },
  ]
  assert.deepEqual(filterMessagesForTopic(messages, '/iot/store/4/+/status'), [messages[0]])
})

test('stored payload analysis creates numeric series, grouped values and structure', () => {
  const result = analyzeStoredMessages([
    { receivedAt: '2026-10-14T10:02:00Z', payload: { temperature: 22, online: true, room: 'lab' } },
    { receivedAt: '2026-10-14T10:01:00Z', payload: { temperature: 20, online: false, room: 'lab' } },
  ])

  assert.deepEqual(result.numericSeries[0], {
    path: 'temperature',
    points: [
      { value: 20, receivedAt: '2026-10-14T10:01:00Z' },
      { value: 22, receivedAt: '2026-10-14T10:02:00Z' },
    ],
  })
  assert.deepEqual(result.groupedValues.find(group => group.path === 'online').values, [
    { value: 'false', count: 1 },
    { value: 'true', count: 1 },
  ])
  assert.deepEqual(result.structure, [
    { path: 'temperature', type: 'number' },
    { path: 'online', type: 'boolean' },
    { path: 'room', type: 'string' },
  ])
})
