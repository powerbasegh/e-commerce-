import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import StatusBadge from '../../components/vendor/StatusBadge.jsx'
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../../components/vendor/StateBlocks.jsx'
import Icon from '../../components/Icon.jsx'
import { api } from '../../services/api.js'
import { formatGHS } from '../../data/mockData.js'
import { ORDER_STATUS } from '../../constants/orderStatus.js'

const STATUS_FILTERS = ['all', ...Object.values(ORDER_STATUS)]
const PAYMENT_FILTERS = ['all', 'PENDING', 'PAID', 'FAILED', 'CANCELLED']

export default function AdminOrdersPage() {
  const [result, setResult] = useState({ orders: [], pagination: { page: 1, totalPages: 1 } })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  function load() {
    setLoading(true)
    setError('')
    api
      .getAdminAllOrders({
        status: statusFilter === 'all' ? '' : statusFilter,
        paymentStatus: paymentFilter === 'all' ? '' : paymentFilter,
        q: query.trim(),
        page,
      })
      .then(setResult)
      .catch((e) => setError(e.message || 'Could not load orders'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(load, query ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, paymentFilter, query, page])

  useEffect(() => setPage(1), [statusFilter, paymentFilter, query])

  const { orders, pagination } = result

  return (
    <AdminLayout title="Orders">
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
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="rounded-lg border border-pb-gray-border bg-white px-3 py-2.5 text-sm outline-none focus:border-pb-green"
        >
          {PAYMENT_FILTERS.map((p) => (
            <option key={p} value={p}>{p === 'all' ? 'All payments' : `Payment: ${p}`}</option>
          ))}
        </select>
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
            {s === 'all' ? 'All' : s.replaceAll('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingBlock label="Loading orders…" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : orders.length === 0 ? (
        <EmptyBlock icon="orders" title="No orders match this filter" description="Try a different status, payment state or search term." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-card border border-pb-gray-border bg-white shadow-card">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr className="border-b border-pb-gray-border text-xs uppercase tracking-wide text-pb-gray-muted">
                  <th className="px-4 py-3 font-semibold">Order #</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Vendors</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-pb-gray-border last:border-0">
                    <td className="px-4 py-3 font-medium text-pb-gray-text">{o.order_number}</td>
                    <td className="px-4 py-3 text-pb-gray-muted">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="text-pb-gray-text">{o.customer_name || '—'}</div>
                      <div className="text-xs text-pb-gray-muted">{o.customer_phone || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-pb-gray-text">{Number(o.vendor_order_count || 0)}</td>
                    <td className="px-4 py-3 font-medium text-pb-gray-text">{formatGHS(Number(o.grand_total))}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${o.payment_status === 'PAID' ? 'text-pb-green-dark' : o.payment_status === 'FAILED' ? 'text-pb-red' : 'text-pb-amber'}`}>
                        {o.payment_status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/admin/orders/${o.id}`} className="text-xs font-semibold text-pb-green hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-pb-gray-muted">Page {pagination.page} of {pagination.totalPages} · {pagination.total} order{pagination.total === 1 ? '' : 's'}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-pb-gray-border px-3 py-1.5 font-semibold text-pb-gray-text disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="rounded-lg border border-pb-gray-border px-3 py-1.5 font-semibold text-pb-gray-text disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  )
}
