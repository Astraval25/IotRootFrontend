import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useWorkspace } from '../realtime/useWorkspace'

export function DashboardOverviewPage() {
  const { devices: cachedDevices, deviceStatuses, usageSummary, error: errorMessage, store, refreshing } = useWorkspace()
  const devices = useMemo(() => cachedDevices ?? [], [cachedDevices])
  const isLoading = cachedDevices === null
  const connectedDevices = useMemo(
    () => devices.filter((device) => deviceStatuses[String(device.id)]?.connected).length,
    [devices, deviceStatuses],
  )
  const disconnectedDevices = Math.max(devices.length - connectedDevices, 0)
  const totalMessages =
    (usageSummary?.inboundMessages ?? 0) + (usageSummary?.outboundMessages ?? 0)
  const totalTransfer =
    (usageSummary?.inboundEstimatedTotalBytes ?? 0) +
    (usageSummary?.outboundEstimatedTotalBytes ?? 0)
  const inboundTransfer = usageSummary?.inboundEstimatedTotalBytes ?? 0
  const outboundTransfer = usageSummary?.outboundEstimatedTotalBytes ?? 0
  return (
    <section className="grid min-h-full gap-6 bg-[#f2f3f3] p-6 max-sm:p-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-2xl font-semibold tracking-tight text-[#1d2f6f]">Overview</h2>
          <p className="mt-1.5 text-[13px] text-slate-500">Your devices at a glance.</p>
        </div>

      </header>

      {errorMessage ? <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage} <button className="ml-3 rounded border border-slate-300 bg-white px-3 py-1.5 font-semibold text-[#1d2f6f] disabled:opacity-50" onClick={() => store.refresh()} disabled={refreshing}>Retry</button></p> : null}

      

      <div className="grid grid-cols-4 gap-4 max-[1060px]:grid-cols-2 max-[560px]:grid-cols-1">
        <article className="grid gap-3 rounded-sm border border-[#d5dbdb] bg-white p-6 shadow-sm">
          <span className="text-[13px] font-medium text-slate-600">Devices</span>
          <strong className="text-3xl font-semibold text-[#1d2f6f]">{isLoading ? '...' : formatCount(devices.length)}</strong>
          <small className="text-xs text-slate-500">{formatCount(connectedDevices)} connected now</small>
        </article>

        <article className="grid gap-3 rounded-sm border border-[#d5dbdb] bg-white p-6 shadow-sm">
          <span className="text-[13px] font-medium text-slate-600">Total Transfer</span>
          <strong className="text-3xl font-semibold text-[#1d2f6f]">{isLoading ? '...' : formatBytes(totalTransfer)}</strong>
          <small className="text-xs text-slate-500">Last 24 hours</small>
        </article>

        <article className="grid gap-3 rounded-sm border border-[#d5dbdb] bg-white p-6 shadow-sm">
          <span className="text-[13px] font-medium text-slate-600">Total Messages</span>
          <strong className="text-3xl font-semibold text-[#1d2f6f]">{isLoading ? '...' : formatCount(totalMessages)}</strong>
          <small className="text-xs text-slate-500">Inbound + outbound</small>
        </article>

        <article className="grid gap-3 rounded-sm border border-[#d5dbdb] bg-white p-6 shadow-sm">
          <span className="text-[13px] font-medium text-slate-600">Online</span>
          <strong className="text-3xl font-semibold text-[#1d2f6f]">{isLoading ? '...' : `${formatCount(connectedDevices)} / ${formatCount(devices.length)}`}</strong>
          <small className="text-xs text-slate-500">{formatCount(disconnectedDevices)} disconnected</small>
        </article>
      </div>

      <div className="grid grid-cols-2 gap-5 max-[900px]:grid-cols-1">
        <article className="grid min-h-[280px] content-start gap-7 rounded-sm border border-[#d5dbdb] bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <h3 className="m-0 text-[15px] font-semibold">Data transfer</h3>
              <p className="mt-1 text-xs text-slate-500">Last 24 hours</p>
            </div>
          </header>

          <div className="flex h-3 overflow-hidden rounded-full bg-[#eef0ff]">
            <div
              className="h-full bg-[#1d2f6f]"
              style={{ width: `${calculatePercent(inboundTransfer, totalTransfer)}%` }}
            />
            <div
              className="h-full bg-[#8390fa]"
              style={{ width: `${calculatePercent(outboundTransfer, totalTransfer)}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid grid-cols-[10px_1fr] items-center gap-x-2 gap-y-0.5">
              <span className="size-2.5 rounded-full bg-[#1d2f6f]" />
              <strong>Inbound</strong>
              <small>{formatBytes(inboundTransfer)}</small>
            </div>
            <div className="grid grid-cols-[10px_1fr] items-center gap-x-2 gap-y-0.5">
              <span className="size-2.5 rounded-full bg-[#8390fa]" />
              <strong>Outbound</strong>
              <small>{formatBytes(outboundTransfer)}</small>
            </div>
          </div>
        </article>

        <article className="grid min-h-[280px] content-start gap-7 rounded-sm border border-[#d5dbdb] bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <div>
              <h3 className="m-0 text-[15px] font-semibold">Devices</h3>
            </div>
          </header>

          {isLoading ? (
            <p className="text-sm text-slate-500">Loading device statuses...</p>
          ) : devices.length === 0 ? (
            <div className="grid justify-items-center gap-4 p-3 text-center"><span className="grid size-12 place-items-center rounded-xl border border-dashed border-[#8390fa] bg-[#eef0ff] text-2xl text-[#1d2f6f]" aria-hidden="true">+</span><h3>Connect your first device</h3><Link className="inline-flex rounded bg-[#1d2f6f] px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-[#8390fa]" to="/iotroot/dashboard/devices?add=1">Add device</Link></div>
          ) : (
            <div className="grid">
              {devices.slice(0, 6).map((device) => {
                const status = deviceStatuses[String(device.id)]

                return (
                  <Link
                    key={device.id}
                    className="flex items-center justify-between gap-4 border-b border-[#dfe3ef] py-3 text-[#232f3e] no-underline hover:bg-[#f7f8fc]"
                    to={`/iotroot/dashboard/devices/${device.id}`}
                  >
                    <div className="grid gap-1">
                      <strong className="text-[13px] font-medium">{device.username}</strong>
                      <span className="text-[11px] text-slate-500">{device.clientId || 'No client id'}</span>
                    </div>
                    <span
                      className={
                        status?.connected
                          ? 'inline-flex rounded-full bg-[#e8eaff] px-2 py-1 text-[11px] font-medium text-[#1d2f6f]'
                          : status ? 'inline-flex rounded-full bg-[#fff3bf] px-2 py-1 text-[11px] font-medium text-[#7a5c00]' : 'inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600'
                      }
                    >
                      {status?.connected ? 'Connected' : status ? 'Disconnected' : 'Unknown'}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </article>
      </div>
    </section>
  )
}

function calculatePercent(value, total) {
  const safeValue = Number(value ?? 0)
  const safeTotal = Number(total ?? 0)
  if (!Number.isFinite(safeValue) || !Number.isFinite(safeTotal) || safeValue <= 0 || safeTotal <= 0) {
    return 0
  }

  return Math.min(100, (safeValue / safeTotal) * 100)
}

function formatBytes(value) {
  const size = Number(value ?? 0)
  if (!Number.isFinite(size) || size <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  let nextValue = size
  let unitIndex = 0

  while (nextValue >= 1024 && unitIndex < units.length - 1) {
    nextValue /= 1024
    unitIndex += 1
  }

  const digits = nextValue >= 100 || unitIndex === 0 ? 0 : 1
  return `${nextValue.toFixed(digits)} ${units[unitIndex]}`
}

function formatCount(value) {
  const count = Number(value ?? 0)
  if (!Number.isFinite(count)) {
    return '0'
  }

  return new Intl.NumberFormat('en-US').format(count)
}
