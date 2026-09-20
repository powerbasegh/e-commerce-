import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import StatCard from '../../components/vendor/StatCard.jsx'
import { LoadingBlock, ErrorBlock } from '../../components/vendor/StateBlocks.jsx'
import { api } from '../../services/api.js'
import { formatGHS } from '../../data/mockData.js'

// Real GET /api/admin/dashboard data only — no invented metrics, no
// hardcoded numbers. If the backend doesn't compute something, it isn't
// shown here.
export default function AdminDashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    setError('')
    api
      .getAdminDashboard()
      .then(setData)
      .catch((e) => setError(e.message || 'Could not load the dashboard'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <LoadingBlock label="Loading dashboard…" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-pb-gray-muted">Orders</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard icon="orders" label="Total orders" value={data.orders.total} />
              <StatCard icon="orders" label="Pending" value={data.orders.pending} tone="amber" />
              <StatCard icon="truck" label="Processing" value={data.orders.processing} />
              <StatCard icon="checkCircle" label="Delivered" value={data.orders.delivered} />
              <StatCard icon="close" label="Cancelled" value={data.orders.cancelled} tone="red" />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-pb-gray-muted">Platform</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <StatCard icon="user" label="Customers" value={data.customers.total} />
              <StatCard icon="vendors" label="Active vendors" value={`${data.vendors.active} / ${data.vendors.total}`} hint={`${data.vendors.verified} verified`} />
              <StatCard icon="box" label="Active products" value={`${data.products.active} / ${data.products.total}`} />
              <StatCard icon="truck" label="Delivery quotes pending" value={data.delivery.pendingQuotes} tone={data.delivery.pendingQuotes > 0 ? 'amber' : 'default'} />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-pb-gray-muted">Payments &amp; settlements</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <StatCard icon="wallet" label="Payments confirmed" value={data.payments.paidCount} hint={formatGHS(data.payments.paidAmount)} />
              <StatCard icon="receipt" label="Settlements pending" value={data.settlements.pending} tone={data.settlements.pending > 0 ? 'amber' : 'default'} />
              <StatCard icon="receipt" label="Settlements paid" value={data.settlements.paid} />
              <StatCard icon="chart" label="PowerBase margin (all-time)" value={formatGHS(data.settlements.totalMargin)} />
            </div>
          </section>

          <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-semibold text-pb-gray-text">Needs attention</h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/admin/delivery" className="rounded-lg border border-pb-gray-border px-4 py-2 text-sm font-semibold text-pb-gray-text hover:bg-pb-gray-bg">
                {data.delivery.pendingQuotes} delivery quote{data.delivery.pendingQuotes === 1 ? '' : 's'} pending
              </Link>
              <Link to="/admin/payments" className="rounded-lg border border-pb-gray-border px-4 py-2 text-sm font-semibold text-pb-gray-text hover:bg-pb-gray-bg">
                Review payments
              </Link>
              <Link to="/admin/settlements" className="rounded-lg border border-pb-gray-border px-4 py-2 text-sm font-semibold text-pb-gray-text hover:bg-pb-gray-bg">
                {data.settlements.pending} settlement{data.settlements.pending === 1 ? '' : 's'} pending
              </Link>
            </div>
          </section>
        </div>
      )}
    </AdminLayout>
  )
}
