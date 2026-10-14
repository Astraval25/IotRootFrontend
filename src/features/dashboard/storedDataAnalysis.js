import { matchesTopicFilter } from './mqttCommands.js'

export function buildTopicDataQuery(topicFilter) {
  if (!/[+#]/.test(topicFilter)) return { topic: topicFilter }
  const wildcardIndex = topicFilter.search(/[+#]/)
  return { topicPrefix: topicFilter.slice(0, wildcardIndex) }
}

export function filterMessagesForTopic(messages, topicFilter) {
  return messages.filter(message => matchesTopicFilter(topicFilter, message.topic))
}

export function analyzeStoredMessages(messages) {
  const numeric = new Map()
  const grouped = new Map()

  for (const message of [...messages].reverse()) {
    const leaves = []
    flattenValue(message.payload, '', leaves)
    for (const leaf of leaves) {
      if (leaf.type === 'number' && Number.isFinite(leaf.value)) {
        if (!numeric.has(leaf.path)) numeric.set(leaf.path, [])
        numeric.get(leaf.path).push({ value: leaf.value, receivedAt: message.receivedAt })
      } else if (['string', 'boolean', 'null'].includes(leaf.type)) {
        if (!grouped.has(leaf.path)) grouped.set(leaf.path, new Map())
        const label = leaf.type === 'string' ? leaf.value : String(leaf.value)
        const counts = grouped.get(leaf.path)
        counts.set(label, (counts.get(label) ?? 0) + 1)
      }
    }
  }

  return {
    structure: structureOf(messages[0]?.payload),
    numericSeries: [...numeric.entries()].map(([path, points]) => ({ path, points })),
    groupedValues: [...grouped.entries()].map(([path, counts]) => ({
      path,
      values: [...counts.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count),
    })),
  }
}

function flattenValue(value, path, leaves) {
  if (Array.isArray(value)) {
    leaves.push({ path: path || '$', type: 'array', value })
    return
  }
  if (value !== null && typeof value === 'object') {
    Object.entries(value).forEach(([key, child]) => flattenValue(child, path ? `${path}.${key}` : key, leaves))
    return
  }
  leaves.push({ path: path || '$', type: value === null ? 'null' : typeof value, value })
}

function structureOf(payload) {
  const leaves = []
  if (payload !== undefined) flattenValue(payload, '', leaves)
  return leaves.map(({ path, type }) => ({ path, type }))
}
