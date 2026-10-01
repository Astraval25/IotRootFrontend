import { useState } from 'react'
import { API_BASE_URL } from '../../../shared/config/env'
import { useWorkspace } from '../realtime/useWorkspace'
import { buildTopicCommands, matchesTopicFilter } from '../mqttCommands'

export function TopicCommands({ device, topic }) {
  const { deviceStatuses, store } = useWorkspace()
  const [password, setPassword] = useState(() => store.getDevicePassword(device.id))
  const [shell, setShell] = useState('bash')
  const [publishTopic, setPublishTopic] = useState(/[+#]/.test(topic.topic) ? '' : topic.topic)
  const [message, setMessage] = useState('hello')
  const [copiedCommand, setCopiedCommand] = useState('')
  const [copyError, setCopyError] = useState('')
  const status = deviceStatuses[String(device.id)]
  const host = status?.brokerHost || new URL(API_BASE_URL, window.location.origin).hostname
  const port = status?.brokerPort ?? 1883
  const canPublish = topic.permission === 'publish' || topic.permission === 'readwrite'
  const wildcard = /[+#]/.test(topic.topic)
  const validPublishTopic = matchesTopicFilter(topic.topic, publishTopic)
  const commands = buildTopicCommands({ device, rule: topic, password, host, port, shell, publishTopic, message })

  async function copy(command) {
    try {
      await navigator.clipboard.writeText(command)
      setCopiedCommand(command)
      setCopyError('')
    } catch { setCopyError('Could not copy. Select the command and copy it manually.') }
  }

  return <section className="topic-commands" aria-label="MQTT commands">
    <header><h3>Commands</h3><span className="dashboard-muted">{host}:{port}</span></header>
    <div className="dashboard-form topic-command-settings">
      <label htmlFor="command-password">Device password<input id="command-password" type="password" value={password} autoComplete="off" placeholder="Enter device password" onChange={event => { setPassword(event.target.value); store.rememberDevicePassword(device.id, event.target.value) }} /></label>
      <label htmlFor="command-shell">Terminal<select id="command-shell" value={shell} onChange={event => setShell(event.target.value)}><option value="bash">Bash / Linux / macOS</option><option value="powershell">PowerShell 7+</option></select></label>
      {canPublish && wildcard && <label className="topic-command-full" htmlFor="publish-topic">Publish topic<input id="publish-topic" value={publishTopic} placeholder={topic.topic.replaceAll('+', 'sensor').replaceAll('#', 'value')} onChange={event => setPublishTopic(event.target.value)} /><small>Use a specific topic matching {topic.topic}.</small></label>}
      {canPublish && <label className="topic-command-full" htmlFor="publish-message">Message<input id="publish-message" value={message} onChange={event => setMessage(event.target.value)} /></label>}
    </div>
    {!password && <p className="dashboard-muted">Enter the password once to include it in commands. Kept only until you leave this signed-in workspace.</p>}
    {password && canPublish && !validPublishTopic && <p className="dashboard-message dashboard-message-error">Enter a matching publish topic without + or #.</p>}
    {commands.map(({ kind, label, command }) => <section className="topic-command-card" key={kind}>
      <header><h4>{label}</h4><button type="button" className="dashboard-secondary-button" onClick={() => copy(command)}>{copiedCommand === command ? 'Copied' : `Copy ${label.toLowerCase()}`}</button></header>
      <pre className="dashboard-cli-block"><code>{command}</code></pre>
    </section>)}
    {copiedCommand && commands.some(item => item.command === copiedCommand) && <span role="status" className="workspace-sr-only">Command copied</span>}
    {copyError && <p role="alert" className="dashboard-message dashboard-message-error">{copyError}</p>}
  </section>
}
