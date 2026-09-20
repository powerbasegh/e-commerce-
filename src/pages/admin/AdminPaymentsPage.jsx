import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../../components/vendor/StateBlocks.jsx'
import Icon from '../../components/Icon.jsx'
import { api } from '../../services/api.js'
import { formatGHS } from '../../data/mockData.js'

const FILTERS = [
  { id: 'PENDING', label: 'Awaiting confirmation' },
  { id: 'PAID', label: 'Confirmed' },
  { id: 'FAILED', label: 'Failed' },
  { id: 'CANCELLED', label: 'Cancelled' },
]

// Payment confirmation itself happens on the order detail page (single
// source of truth for that transactional form) — this page is the
// worklist: find orders by payment state, jump to the one that needs
// action. Real data only, from GET /api/admin/orders/all?paymentStatus=.
export default function AdminPaymentsPage() {
  const [result, setResult] = useState({ orders: [], pagination: { page: 1, totalPages: 1 } })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('PENDING')
  const [query, setQuery] = useState('')

  function load() {
    setLoading(true); setError('')
    api.getAdminAllOrders({ paymentStatus: filter, q: query.trim(), limit: 50 })
      .then(setResult)
      .catch((e) => setError(e.message || 'Could not load payments'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(load, query ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, query])

  const { orders } = result

  return (
    <AdminLayout title="Payments">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pb-gray-muted">
            <Icon name="search" size={16} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order number, customer name or phone…"
            className="w-full rounded-lg border border-pb-gray-border bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-pb-green"
          />
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === f.id ? 'bg-pb-navy text-white' : 'border border-pb-gray-border bg-white text-pb-gray-text hover:bg-pb-gray-bg'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingBlock label="Loading payments…" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : orders.length === 0 ? (
        <EmptyBlock icon="wallet" title="Nothing here" description="No orders match this payment state." />
      ) : (
        <div className="overflow-x-auto rounded-card border border-pb-gray-border bg-white shadow-card">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-pb-gray-border text-xs uppercase tracking-wide text-pb-gray-muted">
                <th className="px-4 py-3 font-semibold">Order #</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Provider</th>
                <th className="px-4 py-3 font-semibold">Reference</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-pb-gray-border last:border-0">
                  <td className="px-4 py-3 font-medium text-pb-gray-text">{o.order_number}</td>
                  <td className="px-4 py-3 text-pb-gray-muted">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-pb-gray-text">{o.customer_name}</td>
                  <td className="px-4 py-3 font-medium">{formatGHS(Number(o.grand_total))}</td>
                  <td className="px-4 py-3 text-pb-gray-muted">{o.provider || '—'}</td>
                  <td className="px-4 py-3 text-pb-gray-muted">{o.transaction_reference || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/orders/${o.id}`} className="text-xs font-semibold text-pb-green hover:underline">
                      {filter === 'PENDING' ? 'Confirm payment' : 'View'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-pb-gray-muted">Payments are recorded from your real provider's outcome (Paystack/Hubtel/etc.) on the order detail page — nothing here can mark a payment PAID by itself.</p>
    </AdminLayout>
  )
}
