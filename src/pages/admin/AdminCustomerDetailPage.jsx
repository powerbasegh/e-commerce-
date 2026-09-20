import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import StatusBadge from '../../components/vendor/StatusBadge.jsx'
import { LoadingBlock, ErrorBlock } from '../../components/vendor/StateBlocks.jsx'
import { api } from '../../services/api.js'
import { formatGHS } from '../../data/mockData.js'

export default function AdminCustomerDetailPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  function load() {
    setLoading(true)
    setError('')
    api
      .getAdminCustomer(id)
      .then(setData)
      .catch((e) => setError(e.message || 'Could not load this customer'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  async function toggleActive() {
    setActionError('')
    try {
      await api.setAdminCustomerStatus(id, !data.customer.is_active)
      load()
    } catch (e) {
      setActionError(e.message || 'Could not update status')
    }
  }

  if (loading) return <AdminLayout title="Customer"><LoadingBlock label="Loading customer…" /></AdminLayout>
  if (error) return <AdminLayout title="Customer"><ErrorBlock message={error} onRetry={load} /></AdminLayout>
  if (!data) return null

  const { customer, orders } = data

  return (
    <AdminLayout
      title={customer.full_name}
      actions={<Link to="/admin/customers" className="text-sm font-semibold text-pb-green hover:underline">Back to customers</Link>}
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card lg:order-2">
          <div className="mb-3"><StatusBadge status={customer.is_active ? 'ACTIVE' : 'INACTIVE'} /></div>
          <div className="space-y-2 text-sm">
            <p><span className="text-pb-gray-muted">Email: </span>{customer.email}</p>
            <p><span className="text-pb-gray-muted">Phone: </span>{customer.phone || '—'}</p>
            <p><span className="text-pb-gray-muted">Joined: </span>{new Date(customer.created_at).toLocaleDateString()}</p>
            <p><span className="text-pb-gray-muted">Orders placed: </span>{orders.length}</p>
          </div>
          {actionError && <p className="mt-3 rounded-lg bg-pb-red/10 p-2.5 text-xs text-pb-red">{actionError}</p>}
          <button type="button" onClick={toggleActive} className="mt-4 w-full rounded-lg border border-pb-gray-border px-4 py-2.5 text-sm font-semibold text-pb-gray-text hover:bg-pb-gray-bg">
            {customer.is_active ? 'Deactivate account' : 'Activate account'}
          </button>
        </section>

        <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card lg:order-1">
          <h2 className="mb-3 text-sm font-bold text-pb-gray-text">Order history</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-pb-gray-muted">No orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[440px] text-left text-sm">
                <thead>
                  <tr className="border-b border-pb-gray-border text-xs uppercase tracking-wide text-pb-gray-muted">
                    <th className="py-2 pr-3 font-semibold">Order #</th>
                    <th className="py-2 pr-3 font-semibold">Date</th>
                    <th className="py-2 pr-3 font-semibold">Total</th>
                    <th className="py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b border-pb-gray-border last:border-0">
                      <td className="py-2 pr-3 text-pb-gray-text">
                        <Link to={`/admin/orders/${o.id}`} className="font-medium text-pb-green hover:underline">{o.order_number}</Link>
                      </td>
                      <td className="py-2 pr-3 text-pb-gray-muted">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="py-2 pr-3">{formatGHS(Number(o.grand_total))}</td>
                      <td className="py-2"><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  )
}
