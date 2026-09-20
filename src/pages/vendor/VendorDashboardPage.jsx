import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import VendorLayout from '../../components/vendor/VendorLayout.jsx'
import StatCard from '../../components/vendor/StatCard.jsx'
import { LoadingBlock, ErrorBlock } from '../../components/vendor/StateBlocks.jsx'
import Icon from '../../components/Icon.jsx'
import { api } from '../../services/api.js'
import { formatGHS } from '../../data/mockData.js'

export default function VendorDashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    setError('')
    api
      .getVendorDashboard()
      .then((res) => setData(res))
      .catch((e) => setError(e.message || 'Could not load your dashboard'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  return (
    <VendorLayout title="Dashboard">
      {loading ? (
        <LoadingBlock label="Loading your dashboard…" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : (
        <div className="flex flex-col gap-6">
          {!data.vendor.verified && (
            <div className="flex items-center gap-3 rounded-card border border-pb-amber/30 bg-pb-amber/10 px-4 py-3 text-sm text-pb-amber">
              <Icon name="shield" size={18} />
              Your store is not yet verified by PowerBase. Some buyer-facing benefits may be limited until verification.
            </div>
          )}

          {data.orders.needsAction > 0 && (
            <Link
              to="/vendor/orders"
              className="flex items-center gap-3 rounded-card border border-pb-green/30 bg-pb-green-light px-4 py-3 text-sm font-medium text-pb-green-dark hover:border-pb-green"
            >
              <Icon name="orders" size={18} />
              {data.orders.needsAction} paid order{data.orders.needsAction === 1 ? '' : 's'} waiting on you to fulfil.
            </Link>
          )}

          {data.products.outOfStock > 0 && (
            <Link
              to="/vendor/inventory"
              className="flex items-center gap-3 rounded-card border border-pb-amber/30 bg-pb-amber/10 px-4 py-3 text-sm font-medium text-pb-amber hover:border-pb-amber"
            >
              <Icon name="inventory" size={18} />
              {data.products.outOfStock} active product{data.products.outOfStock === 1 ? '' : 's'} can't be sold — no stock available.
            </Link>
          )}

          <section>
            <p className="mb-3 text-sm font-semibold text-pb-gray-text">Products</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon="box" label="Total Products" value={data.products.total} />
              <StatCard icon="checkCircle" label="Active Products" value={data.products.active} />
              <StatCard icon="inventory" label="Low Stock" value={data.products.lowStock} tone={data.products.lowStock > 0 ? 'amber' : 'default'} />
              <StatCard icon="close" label="Out of Stock" value={data.products.outOfStock} tone={data.products.outOfStock > 0 ? 'red' : 'default'} />
            </div>
          </section>

          <section>
            <p className="mb-3 text-sm font-semibold text-pb-gray-text">Orders</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard icon="orders" label="Needs Action" value={data.orders.needsAction} tone={data.orders.needsAction > 0 ? 'amber' : 'default'} />
              <StatCard icon="orders" label="Pending" value={data.orders.pending} />
              <StatCard icon="package" label="Processing" value={data.orders.processing} />
              <StatCard icon="box" label="Ready for Delivery" value={data.orders.readyForDelivery} />
              <StatCard icon="truck" label="Out for Delivery" value={data.orders.outForDelivery} />
              <StatCard icon="checkCircle" label="Delivered" value={data.orders.delivered} />
            </div>
          </section>

          <section>
            <p className="mb-3 text-sm font-semibold text-pb-gray-text">Earnings</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon="wallet" label="Total Earned" value={formatGHS(data.earnings.totalGross)} hint="Excludes cancelled orders" />
              <StatCard icon="receipt" label="Awaiting Payment" value={formatGHS(data.earnings.pending)} hint="Not yet eligible" />
              <StatCard icon="checkCircle" label="Available for Payout" value={formatGHS(data.earnings.available)} />
              <StatCard icon="checkCircle" label="Paid Out" value={formatGHS(data.earnings.paid)} />
            </div>
          </section>

          <section className="flex flex-wrap gap-3">
            <Link to="/vendor/products/new" className="rounded-lg bg-pb-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-pb-green-dark">
              Add a Product
            </Link>
            <Link to="/vendor/orders" className="rounded-lg border border-pb-gray-border bg-white px-4 py-2.5 text-sm font-semibold text-pb-gray-text hover:bg-pb-gray-bg">
              View Orders
            </Link>
            <Link to="/vendor/settlements" className="rounded-lg border border-pb-gray-border bg-white px-4 py-2.5 text-sm font-semibold text-pb-gray-text hover:bg-pb-gray-bg">
              View Settlements
            </Link>
          </section>
        </div>
      )}
    </VendorLayout>
  )
}
