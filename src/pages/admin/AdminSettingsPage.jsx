import { useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import { api } from '../../services/api.js'

// Deliberately small. There is no backend settings table/endpoint yet, so
// this page only exposes the one real operational action that already
// exists server-side (server/src/routes/adminRoutes.js ->
// POST /admin/reservations/expire) rather than a page of fake toggles.
export default function AdminSettingsPage() {
  const [hours, setHours] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  async function runSweep(e) {
    e.preventDefault()
    setBusy(true); setError(''); setResult(null)
    try {
      const data = await api.runAdminReservationSweep(hours)
      setResult(data)
    } catch (e) {
      setError(e.message || 'Could not run the sweep')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminLayout title="Settings">
      <div className="max-w-xl space-y-6">
        <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
          <h2 className="mb-1 text-sm font-bold text-pb-gray-text">Stock reservation sweep</h2>
          <p className="mb-4 text-xs text-pb-gray-muted">
            Unpaid orders reserve stock temporarily; a background sweep already releases reservations that expire
            (see RESERVATION_EXPIRY_HOURS / RESERVATION_SWEEP_MINUTES on the server). Use this to run that same
            sweep immediately instead of waiting for the timer — useful right after changing the expiry window.
          </p>
          <form onSubmit={runSweep} className="flex flex-wrap items-end gap-3">
            <label className="text-sm font-medium text-pb-gray-text">
              Expiry window override (hours, optional)
              <input
                type="number"
                min="0"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Use server default"
                className="mt-1 block w-52 rounded-lg border border-pb-gray-border p-2.5 text-sm"
              />
            </label>
            <button disabled={busy} className="rounded-lg bg-pb-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {busy ? 'Running…' : 'Run sweep now'}
            </button>
          </form>
          {error && <p className="mt-3 rounded-lg bg-pb-red/10 p-2.5 text-xs text-pb-red">{error}</p>}
          {result && (
            <p className="mt-3 rounded-lg bg-pb-green-light p-2.5 text-xs text-pb-green-dark">
              Released {result.released ?? 0} expired reservation{(result.released ?? 0) === 1 ? '' : 's'}.
            </p>
          )}
        </section>

        <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
          <h2 className="mb-1 text-sm font-bold text-pb-gray-text">Default vendor settlement share</h2>
          <p className="text-xs text-pb-gray-muted">
            The platform-wide default (80% vendor / 20% PowerBase) and per-vendor overrides are managed from each
            vendor's own page under <span className="font-medium text-pb-gray-text">Vendors</span>, not here — a
            share change only makes sense in the context of the vendor it applies to.
          </p>
        </section>
      </div>
    </AdminLayout>
  )
}
