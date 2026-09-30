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
    <dialog ref={ref} className={`workspace-dialog${wide ? ' workspace-dialog-wide' : ''}`} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
      <header className="workspace-dialog-header"><h2 id={titleId}>{title}</h2><button type="button" className="workspace-close" aria-label="Close dialog" onClick={onClose} disabled={busy}>×</button></header>
      <div className="workspace-dialog-body">{children}</div>
    </dialog>
  )
}
