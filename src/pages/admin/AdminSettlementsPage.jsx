import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import StatusBadge from '../../components/vendor/StatusBadge.jsx'
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../../components/vendor/StateBlocks.jsx'
import { api } from '../../services/api.js'
import { formatGHS } from '../../data/mockData.js'

const STATUS_FILTERS = ['all', 'PENDING', 'ELIGIBLE', 'PROCESSING', 'PAID', 'HELD', 'CANCELLED']

export default function AdminSettlementsPage() {
  const [settlements, setSettlements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editing, setEditing] = useState(null)

  function load() {
    setLoading(true); setError('')
    api.getAdminSettlements().then((res) => setSettlements(res.settlements || [])).catch((e) => setError(e.message || 'Could not load settlements')).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = useMemo(
    () => (statusFilter === 'all' ? settlements : settlements.filter((s) => s.status === statusFilter)),
    [settlements, statusFilter],
  )

  const totals = useMemo(() => {
    const t = { PENDING: 0, ELIGIBLE: 0, PROCESSING: 0, PAID: 0, HELD: 0, CANCELLED: 0, margin: 0 }
    for (const s of settlements) {
      t[s.status] = (t[s.status] || 0) + Number(s.vendor_gross || 0)
      if (s.status !== 'CANCELLED') t.margin += Number(s.powerbase_margin || 0)
    }
    return t
  }, [settlements])

  return (
    <AdminLayout title="Settlements">
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Pending" value={formatGHS(totals.PENDING)} />
        <SummaryStat label="Eligible / Processing" value={formatGHS(totals.ELIGIBLE + totals.PROCESSING)} />
        <SummaryStat label="Paid out" value={formatGHS(totals.PAID)} />
        <SummaryStat label="PowerBase margin" value={formatGHS(totals.margin)} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === s ? 'bg-pb-navy text-white' : 'border border-pb-gray-border bg-white text-pb-gray-text hover:bg-pb-gray-bg'
            }`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingBlock label="Loading settlements…" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyBlock icon="receipt" title="No settlements match this filter" />
      ) : (
        <div className="overflow-x-auto rounded-card border border-pb-gray-border bg-white shadow-card">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-pb-gray-border text-xs uppercase tracking-wide text-pb-gray-muted">
                <th className="px-4 py-3 font-semibold">Vendor</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Order status</th>
                <th className="px-4 py-3 font-semibold">Vendor gross</th>
                <th className="px-4 py-3 font-semibold">Margin</th>
                <th className="px-4 py-3 font-semibold">Payout ref</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-pb-gray-border last:border-0">
                  <td className="px-4 py-3 text-pb-gray-text">{s.store_name}</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/orders/${s.order_id}`} className="font-medium text-pb-green hover:underline">{s.order_number}</Link>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={s.order_status} /></td>
                  <td className="px-4 py-3 font-medium text-pb-green-dark">{formatGHS(Number(s.vendor_gross))}</td>
                  <td className="px-4 py-3 text-pb-navy">{formatGHS(Number(s.powerbase_margin))}</td>
                  <td className="px-4 py-3 text-pb-gray-muted">{s.payout_reference || '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {['PAID', 'CANCELLED'].includes(s.status) ? (
                      <span className="text-xs text-pb-gray-muted">Final</span>
                    ) : (
                      <button type="button" onClick={() => setEditing(s)} className="text-xs font-semibold text-pb-green hover:underline">Update</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <SettlementEditModal
          settlement={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </AdminLayout>
  )
}

function SummaryStat({ label, value }) {
  return (
    <div className="rounded-card border border-pb-gray-border bg-white p-4 shadow-card">
      <p className="text-lg font-bold text-pb-gray-text">{value}</p>
      <p className="text-xs text-pb-gray-muted">{label}</p>
    </div>
  )
}

const NEXT_STATUSES = ['PENDING', 'ELIGIBLE', 'PROCESSING', 'PAID', 'HELD', 'CANCELLED']

function SettlementEditModal({ settlement, onClose, onSaved }) {
  const [status, setStatus] = useState(settlement.status)
  const [payoutReference, setPayoutReference] = useState(settlement.payout_reference || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await api.updateAdminSettlement(settlement.id, { status, payout_reference: payoutReference.trim() })
      onSaved()
    } catch (e) {
      setError(e.message || 'Could not update this settlement')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-pb-navy/40" onClick={() => !busy && onClose()} />
      <div className="relative w-full max-w-md rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
        <h2 className="mb-1 text-base font-bold text-pb-gray-text">{settlement.store_name} · {settlement.order_number}</h2>
        <p className="mb-4 text-xs text-pb-gray-muted">
          Settlement cannot become eligible until PowerBase's payment for this order is PAID, and cannot be marked PAID until the order is DELIVERED.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm font-medium text-pb-gray-text">
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-lg border border-pb-gray-border p-2.5 text-sm">
              {NEXT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium text-pb-gray-text">
            Payout reference {status === 'PAID' && <span className="text-pb-red">*</span>}
            <input value={payoutReference} onChange={(e) => setPayoutReference(e.target.value)} required={status === 'PAID'} className="mt-1 w-full rounded-lg border border-pb-gray-border p-2.5 text-sm" placeholder="e.g. MOMO-TXN-00123" />
          </label>
          {error && <p className="rounded-lg bg-pb-red/10 p-2.5 text-xs text-pb-red">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" disabled={busy} onClick={onClose} className="rounded-lg border border-pb-gray-border px-4 py-2 text-sm font-semibold text-pb-gray-text hover:bg-pb-gray-bg disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={busy} className="rounded-lg bg-pb-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
