import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../../../shared/config/env'
import { createApiKey, fetchApiKeys, revokeApiKey } from '../api/storedDataApi'
import { getCurrentUserId } from '../../auth/session/authSession'

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : 'Never'
}

export function ApiKeysSettings() {
  const [keys, setKeys] = useState([])
  const [name, setName] = useState('Stored data integration')
  const [newKey, setNewKey] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const endpoint = `${API_BASE_URL}/api/v1/store/messages`
  const exampleTopic = `/iot/store/${getCurrentUserId() ?? 'USER_ID'}/sensors/`

  useEffect(() => {
    fetchApiKeys().then(response => setKeys(response.data ?? []))
      .catch(err => setError(err.message || 'Could not load API keys.'))
      .finally(() => setLoading(false))
  }, [])

  async function create(event) {
    event.preventDefault()
    if (busy || !name.trim()) return
    setBusy(true)
    setError('')
    try {
      const response = await createApiKey(name.trim())
      setKeys(current => [response.data.key, ...current])
      setNewKey(response.data.apiKey)
      setCopied(false)
    } catch (err) {
      setError(err.message || 'Could not create API key.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(key) {
    if (busy || !window.confirm(`Delete API key "${key.name}"? Applications using it will stop working immediately.`)) return
    setBusy(true)
    setError('')
    try {
      await revokeApiKey(key.id)
      setKeys(current => current.filter(item => item.id !== key.id))
    } catch (err) {
      setError(err.message || 'Could not delete API key.')
    } finally {
      setBusy(false)
    }
  }

  async function copyKey() {
    await navigator.clipboard.writeText(newKey)
    setCopied(true)
  }

  return (
    <div className="grid gap-6">
      {newKey && <article className="border border-emerald-300 bg-emerald-50 p-5">
        <h3 className="m-0 text-base font-semibold text-emerald-900">Copy your new API key now</h3>
        <p className="mt-1 text-xs text-emerald-800">For security, this complete key will not be shown again.</p>
        <div className="mt-4 flex gap-2 max-sm:flex-col"><code className="min-w-0 flex-1 break-all border border-emerald-200 bg-white p-3 text-xs">{newKey}</code><button type="button" className="rounded bg-[#1d2f6f] px-4 py-2 text-sm font-semibold text-white" onClick={copyKey}>{copied ? 'Copied' : 'Copy key'}</button></div>
      </article>}

      <article className="border border-[#d5dbdb] bg-white shadow-sm">
        <header className="border-b border-[#eaeded] px-5 py-[18px]"><h3 className="m-0 text-[17px] font-semibold">Create API key</h3><p className="mt-1 text-xs text-slate-500">Keys grant read-only access to this account's stored MQTT JSON data.</p></header>
        <form className="flex items-end gap-3 p-5 max-sm:flex-col max-sm:items-stretch" onSubmit={create}>
          <label className="grid flex-1 gap-2 text-xs font-semibold">Key name<input className="min-h-10 rounded border border-slate-300 px-3 text-sm" maxLength="80" value={name} onChange={event => setName(event.target.value)} required /></label>
          <button className="min-h-10 rounded bg-[#1d2f6f] px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={busy}>{busy ? 'Creating…' : 'Create key'}</button>
        </form>
      </article>

      <article className="border border-[#d5dbdb] bg-white shadow-sm">
        <header className="border-b border-[#eaeded] px-5 py-[18px]"><h3 className="m-0 text-[17px] font-semibold">REST endpoint</h3><p className="mt-1 text-xs text-slate-500">Returns the last hour by default. Optional filters: from, to, deviceId, topicPrefix, page and size.</p></header>
        <div className="p-5"><code className="block break-all border border-slate-200 bg-[#f7f8fc] p-3 text-xs">GET {endpoint}</code><pre className="mt-3 overflow-x-auto border border-slate-200 bg-[#17265b] p-4 text-xs text-white"><code>{`curl -H "X-API-Key: YOUR_API_KEY" "${endpoint}?topicPrefix=${exampleTopic}"`}</code></pre></div>
      </article>

      <article className="overflow-hidden border border-[#d5dbdb] bg-white shadow-sm">
        <header className="border-b border-[#eaeded] px-5 py-[18px]"><h3 className="m-0 text-[17px] font-semibold">API keys</h3></header>
        {error && <p className="m-5 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="bg-[#eef0ff] text-[11px] uppercase text-[#1d2f6f]"><th className="px-5 py-3">Name</th><th className="px-5 py-3">Prefix</th><th className="px-5 py-3">Last used</th><th className="px-5 py-3">Successful</th><th className="px-5 py-3">Failed</th><th className="px-5 py-3">Action</th></tr></thead><tbody>
          {keys.map(key => <tr className="border-t border-slate-200" key={key.id}><td className="px-5 py-4 font-medium">{key.name}</td><td className="px-5 py-4 font-mono text-xs">{key.prefix}…</td><td className="px-5 py-4 text-xs text-slate-500">{formatDate(key.lastUsedAt)}</td><td className="px-5 py-4 font-semibold text-emerald-700">{key.successfulRequests ?? 0}</td><td className="px-5 py-4 font-semibold text-red-700">{key.failedRequests ?? 0}</td><td className="px-5 py-4"><button type="button" className="text-xs font-semibold text-red-700 disabled:text-slate-400" disabled={busy} onClick={() => remove(key)}>Delete</button></td></tr>)}
          {!keys.length && <tr><td className="px-5 py-10 text-center text-sm text-slate-500" colSpan="6">{loading ? 'Loading API keys…' : 'No API keys yet.'}</td></tr>}
        </tbody></table></div>
      </article>
    </div>
  )
}
