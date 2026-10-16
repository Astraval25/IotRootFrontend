import { useState } from "react";
import { API_BASE_URL } from "../../../shared/config/env";
import { useWorkspace } from "../realtime/useWorkspace";
import { buildTopicCommands, matchesTopicFilter } from "../mqttCommands";

function defaultShell() {
  return typeof navigator !== "undefined" && /Windows/i.test(navigator.userAgent)
    ? "cmd"
    : "bash";
}

export function TopicCommands({ device, topic }) {
  const { deviceStatuses, store } = useWorkspace();
  const [password, setPassword] = useState(() =>
    store.getDevicePassword(device.id),
  );
  const [shell, setShell] = useState(defaultShell);
  const [publishTopic, setPublishTopic] = useState(
    /[+#]/.test(topic.topic) ? "" : topic.topic,
  );
  const [message, setMessage] = useState(
    topic.topicType === "STORE" ? '{"value":1}' : "hello",
  );
  const [copiedCommand, setCopiedCommand] = useState("");
  const [copyError, setCopyError] = useState("");
  const status = deviceStatuses[String(device.id)];
  const host =
    status?.brokerHost ||
    new URL(API_BASE_URL, window.location.origin).hostname;
  const port = status?.brokerPort ?? 1883;
  const canPublish =
    topic.permission === "publish" || topic.permission === "readwrite";
  const canSubscribe =
    topic.permission === "subscribe" || topic.permission === "readwrite";
  const wildcard = /[+#]/.test(topic.topic);
  const validPublishTopic = matchesTopicFilter(topic.topic, publishTopic);
  const commands = buildTopicCommands({
    device,
    rule: topic,
    password,
    host,
    port,
    shell,
    publishTopic,
    message,
  });
  const httpsEndpoint = `${API_BASE_URL}/api/v1/store/messages?deviceId=${device.id}&topic=${encodeURIComponent(topic.topic)}`;
  const httpsCommand = `curl -H "X-API-Key: YOUR_API_KEY" "${httpsEndpoint}"`;

  async function copy(command) {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommand(command);
      setCopyError("");
    } catch {
      setCopyError("Could not copy. Select the command and copy it manually.");
    }
  }

  return (
    <section className="grid gap-5" aria-label="MQTT commands">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h3 className="m-0 text-base font-semibold">MQTT commands</h3>
        </div>
        <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
          {host}:{port}
        </span>
      </header>
      <div className="flex flex-wrap gap-2">
        {canPublish && (
          <span className="rounded-full bg-[#eef0ff] px-2.5 py-1 text-[11px] font-semibold text-[#1d2f6f]">
            Publish allowed
          </span>
        )}
        {canSubscribe && (
          <span className="rounded-full bg-[#fff3bf] px-2.5 py-1 text-[11px] font-semibold text-[#7a5c00]">
            Subscribe allowed
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1 [&_label]:grid [&_label]:gap-2 [&_label]:text-xs [&_label]:font-semibold [&_input]:min-h-10 [&_input]:rounded [&_input]:border [&_input]:border-slate-300 [&_input]:px-3 [&_select]:min-h-10 [&_select]:rounded [&_select]:border [&_select]:border-slate-300 [&_select]:px-3">
        <label htmlFor="command-password">
          Device password
          <input
            id="command-password"
            type="password"
            value={password}
            autoComplete="off"
            placeholder="Enter device password"
            onChange={(event) => {
              setPassword(event.target.value);
              store.rememberDevicePassword(device.id, event.target.value);
            }}
          />
        </label>
        <label htmlFor="command-shell">
          Terminal
          <select
            id="command-shell"
            value={shell}
            onChange={(event) => setShell(event.target.value)}
          >
            <option value="cmd">Windows Command Prompt</option>
            <option value="bash">Bash / Linux / macOS</option>
            <option value="powershell">PowerShell 7+</option>
          </select>
        </label>
        {canPublish && wildcard && (
          <label className="col-span-full" htmlFor="publish-topic">
            Publish topic
            <input
              id="publish-topic"
              value={publishTopic}
              placeholder={topic.topic
                .replaceAll("+", "sensor")
                .replaceAll("#", "value")}
              onChange={(event) => setPublishTopic(event.target.value)}
            />
            <small className="font-normal text-slate-500">
              Use a specific topic matching {topic.topic}.
            </small>
          </label>
        )}
        {canPublish && (
          <label className="col-span-full" htmlFor="publish-message">
            {topic.topicType === "STORE" ? "JSON message" : "Message"}
            <input
              id="publish-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            {topic.topicType === "STORE" && (
              <small className="font-normal text-slate-500">
                Stored topics accept valid JSON payloads up to 1 MB.
              </small>
            )}
          </label>
        )}
      </div>
      {!password && (
        <p className="rounded border border-[#fac748] bg-amber-50 p-3 text-xs text-amber-900">
          Enter the device password to generate the{" "}
          {canPublish && canSubscribe
            ? "publish and subscribe commands"
            : canPublish
              ? "publish command"
              : "subscribe command"}
          . It is kept only for this signed-in workspace.
        </p>
      )}
      {password && canPublish && !validPublishTopic && (
        <p className="rounded bg-red-50 p-3 text-sm text-red-700">
          Enter a matching publish topic without + or #.
        </p>
      )}
      {commands.map(({ kind, label, command }) => (
        <section
          className="rounded border border-[#d5dbdb] bg-[#f7f8fc] p-4"
          key={kind}
        >
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`size-2 rounded-full ${kind === "publish" ? "bg-[#8390fa]" : "bg-[#fac748]"}`}
              />
              <h4 className="m-0 text-sm font-semibold">{label} command</h4>
            </div>
            <button
              type="button"
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#1d2f6f] hover:bg-[#eef0ff]"
              onClick={() => copy(command)}
            >
              {copiedCommand === command
                ? "Copied"
                : `Copy ${label.toLowerCase()} command`}
            </button>
          </header>
          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-all rounded border border-slate-200 bg-[#17265b] p-4 text-xs leading-6 text-white">
            <code>{command}</code>
          </pre>
        </section>
      ))}
      {topic.topicType === "STORE" && (
        <section className="rounded border border-emerald-200 bg-emerald-50 p-4">
          <header className="flex items-center justify-between gap-4"><h4 className="m-0 text-sm font-semibold text-emerald-900">Read stored data over HTTPS</h4><button type="button" className="rounded border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800" onClick={() => copy(httpsCommand)}>{copiedCommand === httpsCommand ? "Copied" : "Copy curl command"}</button></header>
          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-all rounded bg-[#17265b] p-4 text-xs leading-6 text-white"><code>{httpsCommand}</code></pre>
          <p className="mb-0 mt-2 text-xs text-emerald-800">Create an API key in Settings, then replace YOUR_API_KEY.</p>
        </section>
      )}
      {copiedCommand &&
        commands.some((item) => item.command === copiedCommand) && (
          <span role="status" className="sr-only">
            Command copied
          </span>
        )}
      {copyError && (
        <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">
          {copyError}
        </p>
      )}
    </section>
  );
}
