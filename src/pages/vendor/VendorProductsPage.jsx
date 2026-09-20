import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import VendorLayout from '../../components/vendor/VendorLayout.jsx'
import StatusBadge from '../../components/vendor/StatusBadge.jsx'
import ConfirmDialog from '../../components/vendor/ConfirmDialog.jsx'
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../../components/vendor/StateBlocks.jsx'
import Icon from '../../components/Icon.jsx'
import { api } from '../../services/api.js'
import { formatGHS } from '../../data/mockData.js'

const PAGE_SIZE = 20

export default function VendorProductsPage() {
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [busyId, setBusyId] = useState(null)
  const [pendingDeactivate, setPendingDeactivate] = useState(null)
  const [hasAnyProduct, setHasAnyProduct] = useState(true)

  // Search, filtering, sorting and paging are all server-side and scoped to
  // the authenticated vendor in SQL.
  function load() {
    setLoading(true)
    setError('')
    api
      .getVendorProducts({
        q: query.trim(),
        status: statusFilter === 'all' ? '' : statusFilter,
        sort,
        page,
        limit: PAGE_SIZE,
      })
      .then((res) => {
        setProducts(res.products || [])
        setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 })
        if (!query.trim() && statusFilter === 'all') setHasAnyProduct((res.pagination?.total || 0) > 0)
      })
      .catch((e) => setError(e.message || 'Could not load your products'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(load, query ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, statusFilter, sort, page])

  // Any change to the filters should restart at page 1.
  useEffect(() => {
    setPage(1)
  }, [query, statusFilter, sort])

  async function toggleStatus(product) {
    setBusyId(product.id)
    setError('')
    setNotice('')
    try {
      await api.setVendorProductStatus(product.id, !product.isActive)
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, isActive: !p.isActive } : p)))
      setNotice(product.isActive ? `${product.name} is no longer visible to customers` : `${product.name} is live again`)
    } catch (e) {
      setError(e.message || 'Could not update product status')
    } finally {
      setBusyId(null)
      setPendingDeactivate(null)
    }
  }

  // Deactivating pulls a product out of the customer catalogue, so it asks
  // first; reactivating is harmless and doesn't.
  function requestToggle(product) {
    if (product.isActive) setPendingDeactivate(product)
    else toggleStatus(product)
  }

  return (
    <VendorLayout
      title="Products"
      actions={
        <Link to="/vendor/products/new" className="flex items-center gap-2 rounded-lg bg-pb-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-pb-green-dark">
          <Icon name="plus" size={16} />
          Add Product
        </Link>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pb-gray-muted">
            <Icon name="search" size={16} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or SKU…"
            className="w-full rounded-lg border border-pb-gray-border bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-pb-green"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="rounded-lg border border-pb-gray-border bg-white px-3 py-2.5 text-sm outline-none focus:border-pb-green"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort products"
          className="rounded-lg border border-pb-gray-border bg-white px-3 py-2.5 text-sm outline-none focus:border-pb-green"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name_asc">Name A–Z</option>
          <option value="price_desc">Price high to low</option>
          <option value="price_asc">Price low to high</option>
          <option value="stock_asc">Lowest stock first</option>
        </select>
      </div>

      {notice && <p className="mb-3 rounded-lg bg-pb-green-light px-3 py-2 text-sm text-pb-green-dark">{notice}</p>}

      {loading ? (
        <LoadingBlock label="Loading your products…" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : products.length === 0 ? (
        <EmptyBlock
          icon="box"
          title={hasAnyProduct ? 'No products match your filters' : 'No products yet'}
          description={hasAnyProduct ? 'Try a different search term, status or sort.' : 'Add your first product to start selling on PowerBase.'}
          action={
            !hasAnyProduct ? (
              <Link to="/vendor/products/new" className="mt-2 rounded-lg bg-pb-green px-4 py-2 text-sm font-semibold text-white hover:bg-pb-green-dark">
                Add a Product
              </Link>
            ) : null
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-card border border-pb-gray-border bg-white shadow-card">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-pb-gray-border text-xs uppercase tracking-wide text-pb-gray-muted">
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Available</th>
                  <th className="px-4 py-3 font-semibold">Your Gross</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-pb-gray-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.image || '/products/placeholder.svg'} alt="" className="h-11 w-11 shrink-0 rounded-lg border border-pb-gray-border object-cover" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-pb-gray-text">{p.name}</p>
                          {p.sku && <p className="text-xs text-pb-gray-muted">SKU {p.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-pb-gray-muted">{p.category?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-pb-gray-text">{formatGHS(p.price)}</p>
                      {p.oldPrice != null && <p className="text-xs text-pb-gray-muted line-through">{formatGHS(p.oldPrice)}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={p.available <= 0 ? 'font-semibold text-pb-red' : p.lowStock ? 'font-semibold text-pb-amber' : 'text-pb-gray-text'}>
                        {p.available}
                      </span>
                      {p.reserved > 0 && <p className="text-xs text-pb-gray-muted">{p.reserved} reserved</p>}
                    </td>
                    <td className="px-4 py-3 font-medium text-pb-green-dark">{formatGHS(p.vendorGross)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/vendor/products/${encodeURIComponent(p.id)}/edit`} className="rounded-lg border border-pb-gray-border px-3 py-1.5 text-xs font-semibold text-pb-gray-text hover:bg-pb-gray-bg">
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled={busyId === p.id}
                          onClick={() => requestToggle(p)}
                          className="rounded-lg border border-pb-gray-border px-3 py-1.5 text-xs font-semibold text-pb-gray-text hover:bg-pb-gray-bg disabled:opacity-50"
                        >
                          {p.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-pb-gray-muted">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} product(s)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-pb-gray-border bg-white px-3 py-1.5 text-xs font-semibold text-pb-gray-text hover:bg-pb-gray-bg disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-pb-gray-border bg-white px-3 py-1.5 text-xs font-semibold text-pb-gray-text hover:bg-pb-gray-bg disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingDeactivate)}
        busy={busyId === pendingDeactivate?.id}
        tone="danger"
        title="Deactivate this product?"
        description={`${pendingDeactivate?.name || 'This product'} will be removed from the PowerBase catalogue and customers won't be able to order it. You can reactivate it at any time.`}
        confirmLabel="Deactivate"
        onConfirm={() => toggleStatus(pendingDeactivate)}
        onCancel={() => setPendingDeactivate(null)}
      />
    </VendorLayout>
  )
}
