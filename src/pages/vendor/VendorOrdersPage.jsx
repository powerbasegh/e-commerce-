import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import VendorLayout from '../../components/vendor/VendorLayout.jsx'
import StatusBadge from '../../components/vendor/StatusBadge.jsx'
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../../components/vendor/StateBlocks.jsx'
import Icon from '../../components/Icon.jsx'
import { api } from '../../services/api.js'
import { formatGHS } from '../../data/mockData.js'

const STATUS_FILTERS = ['all', 'PENDING', 'PROCESSING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')

  // Filtering happens server-side, inside the vendor-scoped query.
  function load() {
    setLoading(true)
    setError('')
    api
      .getVendorOrders({ status: statusFilter === 'all' ? '' : statusFilter, q: query.trim() })
      .then((res) => setOrders(res.orders || []))
      .catch((e) => setError(e.message || 'Could not load your orders'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(load, query ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, query])

  // The server tells us which orders it will actually accept an action on.
  const actionable = orders.filter((o) => (o.availableTransitions || []).length > 0).length

  return (
    <VendorLayout title="Orders">
      {actionable > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-card border border-pb-green/30 bg-pb-green-light px-4 py-3 text-sm text-pb-green-dark">
          <Icon name="orders" size={18} />
          {actionable} order{actionable === 1 ? '' : 's'} need your attention.
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pb-gray-muted">
            <Icon name="search" size={16} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by PowerBase order number…"
            className="w-full rounded-lg border border-pb-gray-border bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-pb-green"
          />
        </div>
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
        <LoadingBlock label="Loading your orders…" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : orders.length === 0 ? (
        <EmptyBlock
          icon="orders"
          title="No orders here"
          description={
            statusFilter === 'all' && !query
              ? 'Orders assigned to you for fulfilment will show up here.'
              : 'No orders match this filter.'
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-card border border-pb-gray-border bg-white shadow-card">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-pb-gray-border text-xs uppercase tracking-wide text-pb-gray-muted">
                <th className="px-4 py-3 font-semibold">Order #</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Your Gross</th>
                <th className="px-4 py-3 font-semibold">Settlement</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-pb-gray-border last:border-0">
                  <td className="px-4 py-3 font-medium text-pb-gray-text">{o.order_number}</td>
                  <td className="px-4 py-3 text-pb-gray-muted">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-pb-gray-text">
                    {Number(o.item_count || 0)}
                    <span className="text-pb-gray-muted"> ({Number(o.unit_count || 0)} unit{Number(o.unit_count) === 1 ? '' : 's'})</span>
                  </td>
                  <td className="px-4 py-3">
                    {o.paymentConfirmed ? (
                      <span className="text-xs font-semibold text-pb-green-dark">Confirmed</span>
                    ) : (
                      <span className="text-xs font-semibold text-pb-amber">Awaiting</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 font-medium text-pb-green-dark">
                    {o.vendor_gross != null ? formatGHS(Number(o.vendor_gross)) : '—'}
                  </td>
                  <td className="px-4 py-3">{o.settlement_status ? <StatusBadge status={o.settlement_status} /> : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/vendor/orders/${o.id}`} className="text-xs font-semibold text-pb-green hover:underline">
                      {(o.availableTransitions || []).length > 0 ? 'Action needed' : 'View'}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </VendorLayout>
  )
}
