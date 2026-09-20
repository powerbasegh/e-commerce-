import { useEffect, useState } from 'react'
import VendorLayout from '../../components/vendor/VendorLayout.jsx'
import StatCard from '../../components/vendor/StatCard.jsx'
import { LoadingBlock, ErrorBlock } from '../../components/vendor/StateBlocks.jsx'
import { api } from '../../services/api.js'
import { formatGHS } from '../../data/mockData.js'

export default function VendorEarningsPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    setError('')
    api
      .getVendorEarnings()
      .then(setData)
      .catch((e) => setError(e.message || 'Could not load your earnings'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  return (
    <VendorLayout title="Earnings">
      {loading ? (
        <LoadingBlock label="Loading your earnings…" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
            <p className="text-xs text-pb-gray-muted">Total Gross (all time)</p>
            <p className="mt-1 text-3xl font-bold text-pb-green-dark">{formatGHS(data.totalGross)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard icon="wallet" label="Pending" value={formatGHS(data.byStatus.PENDING)} hint={`${data.countByStatus.PENDING} order(s)`} />
            <StatCard icon="checkCircle" label="Eligible" value={formatGHS(data.byStatus.ELIGIBLE)} hint={`${data.countByStatus.ELIGIBLE} order(s)`} />
            <StatCard icon="receipt" label="Processing" value={formatGHS(data.byStatus.PROCESSING)} hint={`${data.countByStatus.PROCESSING} order(s)`} />
            <StatCard icon="checkCircle" label="Paid" value={formatGHS(data.byStatus.PAID)} hint={`${data.countByStatus.PAID} order(s)`} />
            <StatCard icon="shield" label="Held" value={formatGHS(data.byStatus.HELD)} tone="amber" hint={`${data.countByStatus.HELD} order(s)`} />
            <StatCard icon="close" label="Cancelled" value={formatGHS(data.byStatus.CANCELLED)} tone="red" hint={`${data.countByStatus.CANCELLED} order(s)`} />
          </div>

          <p className="text-xs text-pb-gray-muted">
            A settlement becomes eligible once PowerBase confirms payment, and can only be marked paid once the order is delivered — see the Settlements page for the full history.
          </p>
        </div>
      )}
    </VendorLayout>
  )
}
