import { useEffect, useId, useRef } from 'react'

export function WorkspaceDialog({ title, onClose, busy = false, wide = false, children }) {
  const ref = useRef(null)
  const titleId = useId()
  useEffect(() => {
    const dialog = ref.current
    const previousFocus = document.activeElement
    dialog.showModal()
    return () => { dialog.close(); previousFocus?.focus() }
  }, [])
  return (
    <dialog
      ref={ref}
      className={`m-auto max-h-[calc(100dvh-48px)] w-[min(520px,calc(100%-32px))] overflow-hidden rounded-lg border border-slate-300 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/45 ${wide ? 'max-w-none !w-[min(1100px,calc(100%-48px))]' : ''}`}
      aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); if (!busy) onClose() }}
    >
      <header className="sticky top-0 z-10 flex items-center justify-between gap-5 border-b border-slate-200 bg-white px-6 py-4">
        <h2 className="m-0 text-lg font-semibold tracking-tight text-[#16191f]" id={titleId}>{title}</h2>
        <button type="button" className="grid size-8 shrink-0 place-items-center rounded border border-slate-200 bg-white text-xl leading-none text-slate-500 hover:border-[#8390fa] hover:bg-[#eef0ff] hover:text-[#1d2f6f] disabled:opacity-50" aria-label="Close dialog" onClick={onClose} disabled={busy}>×</button>
      </header>
      <div className="max-h-[calc(100dvh-112px)] overflow-y-auto p-6">{children}</div>
    </dialog>
  )
}
