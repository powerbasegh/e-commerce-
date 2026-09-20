import { useEffect, useState } from 'react'
import VendorLayout from '../../components/vendor/VendorLayout.jsx'
import StatusBadge from '../../components/vendor/StatusBadge.jsx'
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../../components/vendor/StateBlocks.jsx'
import { api } from '../../services/api.js'
import { formatGHS } from '../../data/mockData.js'

export default function VendorSettlementsPage() {
  const [settlements, setSettlements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    setError('')
    api
      .getVendorSettlements()
      .then((res) => setSettlements(res.settlements || []))
      .catch((e) => setError(e.message || 'Could not load your settlements'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  return (
    <VendorLayout title="Settlements">
      {loading ? (
        <LoadingBlock label="Loading your settlements…" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : settlements.length === 0 ? (
        <EmptyBlock icon="receipt" title="No settlements yet" description="Settlements are created automatically once a customer's order is placed and become payable once PowerBase confirms payment and delivery." />
      ) : (
        <div className="overflow-x-auto rounded-card border border-pb-gray-border bg-white shadow-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-pb-gray-border text-xs uppercase tracking-wide text-pb-gray-muted">
                <th className="px-4 py-3 font-semibold">Order #</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Your Gross</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Eligible</th>
                <th className="px-4 py-3 font-semibold">Paid</th>
                <th className="px-4 py-3 font-semibold">Payout Reference</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((s) => (
                <tr key={s.id} className="border-b border-pb-gray-border last:border-0">
                  <td className="px-4 py-3 font-medium text-pb-gray-text">{s.order_number}</td>
                  <td className="px-4 py-3 text-pb-gray-muted">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium text-pb-green-dark">{formatGHS(Number(s.vendor_gross))}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-pb-gray-muted">{s.eligible_at ? new Date(s.eligible_at).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-xs text-pb-gray-muted">{s.paid_at ? new Date(s.paid_at).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3 text-xs text-pb-gray-muted">{s.payout_reference || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </VendorLayout>
  )
}
