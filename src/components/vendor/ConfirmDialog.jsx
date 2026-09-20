import { useEffect, useRef } from 'react'

/**
 * Confirmation for actions that can't be undone from the vendor side —
 * cancelling a vendor order, deactivating a live product. Deliberately plain:
 * no emoji, no icon decoration, matching the rest of the vendor surface.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  busy = false,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    confirmRef.current?.focus()
    function onKeyDown(e) {
      if (e.key === 'Escape' && !busy) onCancel?.()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, busy, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-pb-navy/40"
        onClick={() => !busy && onCancel?.()}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative w-full max-w-md rounded-card border border-pb-gray-border bg-white p-5 shadow-card"
      >
        <h2 id="confirm-dialog-title" className="text-base font-bold text-pb-gray-text">
          {title}
        </h2>
        {description && <p className="mt-2 text-sm text-pb-gray-muted">{description}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-lg border border-pb-gray-border px-4 py-2 text-sm font-semibold text-pb-gray-text hover:bg-pb-gray-bg disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
              tone === 'danger' ? 'bg-pb-red hover:bg-pb-red/90' : 'bg-pb-green hover:bg-pb-green-dark'
            }`}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
