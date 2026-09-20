import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import StatusBadge from '../../components/vendor/StatusBadge.jsx'
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../../components/vendor/StateBlocks.jsx'
import Icon from '../../components/Icon.jsx'
import { api } from '../../services/api.js'
import { formatGHS } from '../../data/mockData.js'

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    api.getAdminCategories().then((res) => setCategories(res.categories || [])).catch(() => {})
  }, [])

  function load() {
    setLoading(true)
    setError('')
    api
      .getAdminProducts({ q: query.trim(), status: statusFilter === 'all' ? '' : statusFilter, category: categoryFilter === 'all' ? '' : categoryFilter })
      .then((res) => setProducts(res.products || []))
      .catch((e) => setError(e.message || 'Could not load products'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(load, query ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, statusFilter, categoryFilter])

  async function toggleActive(p) {
    try {
      await api.setAdminProductStatus(p.id, !p.is_active)
      load()
    } catch (e) {
      setError(e.message || 'Could not update product status')
    }
  }

  return (
    <AdminLayout title="Products">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pb-gray-muted">
            <Icon name="search" size={16} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products by name…"
            className="w-full rounded-lg border border-pb-gray-border bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-pb-green"
          />
        </div>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-lg border border-pb-gray-border bg-white px-3 py-2.5 text-sm outline-none focus:border-pb-green">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-pb-gray-border bg-white px-3 py-2.5 text-sm outline-none focus:border-pb-green">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <LoadingBlock label="Loading products…" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : products.length === 0 ? (
        <EmptyBlock icon="box" title="No products match this filter" />
      ) : (
        <div className="overflow-x-auto rounded-card border border-pb-gray-border bg-white shadow-card">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-pb-gray-border text-xs uppercase tracking-wide text-pb-gray-muted">
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Vendor</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-pb-gray-border last:border-0">
                  <td className="px-4 py-3 font-medium text-pb-gray-text">{p.name}</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/vendors/${p.vendor_id}`} className="text-pb-green hover:underline">{p.store_name}</Link>
                  </td>
                  <td className="px-4 py-3 text-pb-gray-muted">{p.category_name || '—'}</td>
                  <td className="px-4 py-3">{formatGHS(Number(p.price))}</td>
                  <td className="px-4 py-3">{p.stock_quantity}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(p)} type="button">
                      <StatusBadge status={p.is_active ? 'ACTIVE' : 'INACTIVE'} />
                    </button>
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-pb-gray-muted">Showing up to 200 most recent products. Vendors author product content directly — Admin can moderate (activate/deactivate) but not edit vendor product details from here.</p>
    </AdminLayout>
  )
}
