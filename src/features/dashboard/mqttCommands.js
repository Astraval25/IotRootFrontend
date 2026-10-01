export const permissionLabels = { publish: 'Publish', subscribe: 'Subscribe', readwrite: 'Publish & subscribe' }

export function quoteShellArgument(value, shell = 'bash') {
  const text = String(value)
  return shell === 'powershell' ? `'${text.replaceAll("'", "''")}'` : `'${text.replaceAll("'", "'\\''")}'`
}

export function matchesTopicFilter(filter, topic) {
  if (!topic || /[+#]/.test(topic) || topic.includes('\0')) return false
  const filterLevels = filter.split('/')
  const topicLevels = topic.split('/')
  if (topic.startsWith('$') && !filter.startsWith('$')) return false
  for (let i = 0; i < filterLevels.length; i++) {
    if (filterLevels[i] === '#') return i === filterLevels.length - 1
    if (i >= topicLevels.length || (filterLevels[i] !== '+' && filterLevels[i] !== topicLevels[i])) return false
  }
  return filterLevels.length === topicLevels.length
}

export function buildTopicCommands({ device, rule, password, host, port = 1883, shell = 'bash', publishTopic = rule.topic, message = 'hello' }) {
  if (!device?.username || !device?.clientId || !host || !password) return []
  const portNumber = Number(port)
  if (!Number.isInteger(portNumber) || portNumber < 1 || portNumber > 65535) return []
  const quote = value => quoteShellArgument(value, shell)
  const common = `-h ${quote(host)} -p ${portNumber} -u ${quote(device.username)} -P ${quote(password)} -i ${quote(device.clientId)}`
  const commands = []
  if ((rule.permission === 'publish' || rule.permission === 'readwrite') && matchesTopicFilter(rule.topic, publishTopic)) {
    commands.push({ kind: 'publish', label: 'Publish', command: `mosquitto_pub ${common} -t ${quote(publishTopic)} -m ${quote(message)} -q 1` })
  }
  if (rule.permission === 'subscribe' || rule.permission === 'readwrite') {
    commands.push({ kind: 'subscribe', label: 'Subscribe', command: `mosquitto_sub ${common} -t ${quote(rule.topic)} -q 1 -v` })
  }
  return commands
}
