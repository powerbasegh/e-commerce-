import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import StatusBadge from '../../components/vendor/StatusBadge.jsx'
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../../components/vendor/StateBlocks.jsx'
import Icon from '../../components/Icon.jsx'
import { api } from '../../services/api.js'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  function load() {
    setLoading(true)
    setError('')
    api
      .getAdminCustomers({ q: query.trim(), status: statusFilter === 'all' ? '' : statusFilter })
      .then((res) => setCustomers(res.customers || []))
      .catch((e) => setError(e.message || 'Could not load customers'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(load, query ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, statusFilter])

  async function toggleActive(c) {
    try {
      await api.setAdminCustomerStatus(c.id, !c.is_active)
      load()
    } catch (e) {
      setError(e.message || 'Could not update customer status')
    }
  }

  return (
    <AdminLayout title="Customers">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pb-gray-muted">
            <Icon name="search" size={16} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full rounded-lg border border-pb-gray-border bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-pb-green"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-pb-gray-border bg-white px-3 py-2.5 text-sm outline-none focus:border-pb-green">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <LoadingBlock label="Loading customers…" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : customers.length === 0 ? (
        <EmptyBlock icon="user" title="No customers match this filter" />
      ) : (
        <div className="overflow-x-auto rounded-card border border-pb-gray-border bg-white shadow-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-pb-gray-border text-xs uppercase tracking-wide text-pb-gray-muted">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Orders</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-pb-gray-border last:border-0">
                  <td className="px-4 py-3 font-medium text-pb-gray-text">{c.full_name}</td>
                  <td className="px-4 py-3">
                    <div className="text-pb-gray-text">{c.email}</div>
                    <div className="text-xs text-pb-gray-muted">{c.phone || '—'}</div>
                  </td>
                  <td className="px-4 py-3">{Number(c.order_count || 0)}</td>
                  <td className="px-4 py-3 text-pb-gray-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(c)} type="button">
                      <StatusBadge status={c.is_active ? 'ACTIVE' : 'INACTIVE'} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/customers/${c.id}`} className="text-xs font-semibold text-pb-green hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
