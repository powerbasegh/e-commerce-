import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import VendorLayout from '../../components/vendor/VendorLayout.jsx'
import StatusBadge from '../../components/vendor/StatusBadge.jsx'
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../../components/vendor/StateBlocks.jsx'
import Icon from '../../components/Icon.jsx'
import { api } from '../../services/api.js'

const STOCK_FILTERS = [
  { id: 'all', label: 'All products' },
  { id: 'low', label: 'Low stock' },
  { id: 'out', label: 'Out of stock' },
]

export default function VendorInventoryPage() {
  const [products, setProducts] = useState([])
  const [threshold, setThreshold] = useState(5)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [drafts, setDrafts] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [stockFilter, setStockFilter] = useState('all')
  const [query, setQuery] = useState('')

  // Filtering and search run on the server so the vendor's own scoping is
  // applied in SQL, not by trimming a list in the browser.
  function load() {
    setLoading(true)
    setError('')
    api
      .getVendorInventory({ stock: stockFilter === 'all' ? '' : stockFilter, q: query.trim() })
      .then((res) => {
        setProducts(res.products || [])
        if (res.lowStockThreshold != null) setThreshold(res.lowStockThreshold)
      })
      .catch((e) => setError(e.message || 'Could not load your inventory'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(load, query ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockFilter, query])

  async function saveStock(product) {
    const raw = drafts[product.id]
    const value = Number(raw)
    if (!Number.isInteger(value) || value < 0) {
      setError('Stock must be a whole number, 0 or more')
      return
    }
    setSavingId(product.id)
    setError('')
    setNotice('')
    try {
      // The server recomputes available stock and rejects anything below what
      // is already reserved — the numbers below come back from it, not from
      // optimistic local arithmetic.
      const res = await api.updateVendorProductStock(product.id, value)
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? { ...p, stock: res.stock, reserved: res.reserved, available: res.available, lowStock: res.available <= threshold }
            : p,
        ),
      )
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[product.id]
        return next
      })
      setNotice(`Stock updated for ${product.name}`)
    } catch (e) {
      setError(e.message || 'Could not update stock')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <VendorLayout title="Inventory">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-pb-gray-muted">
            <Icon name="search" size={16} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product name or SKU…"
            className="w-full rounded-lg border border-pb-gray-border bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-pb-green"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STOCK_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStockFilter(f.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                stockFilter === f.id
                  ? 'bg-pb-navy text-white'
                  : 'border border-pb-gray-border bg-white text-pb-gray-text hover:bg-pb-gray-bg'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {notice && <p className="mb-3 rounded-lg bg-pb-green-light px-3 py-2 text-sm text-pb-green-dark">{notice}</p>}
      {error && products.length > 0 && (
        <p className="mb-3 rounded-lg bg-pb-red/10 px-3 py-2 text-sm text-pb-red">{error}</p>
      )}

      {loading ? (
        <LoadingBlock label="Loading your inventory…" />
      ) : error && !products.length ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : products.length === 0 ? (
        <EmptyBlock
          icon="inventory"
          title={stockFilter === 'all' && !query ? 'No products yet' : 'Nothing matches'}
          description={
            stockFilter === 'all' && !query
              ? 'Add a product and its stock will be tracked here.'
              : 'Try a different search term or stock filter.'
          }
          action={
            stockFilter === 'all' && !query ? (
              <Link to="/vendor/products/new" className="mt-2 rounded-lg bg-pb-green px-4 py-2 text-sm font-semibold text-white hover:bg-pb-green-dark">
                Add a Product
              </Link>
            ) : null
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-card border border-pb-gray-border bg-white shadow-card">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-pb-gray-border text-xs uppercase tracking-wide text-pb-gray-muted">
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">SKU</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">In Stock</th>
                  <th className="px-4 py-3 font-semibold">Reserved</th>
                  <th className="px-4 py-3 font-semibold">Available</th>
                  <th className="px-4 py-3 font-semibold">Set Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const draft = drafts[p.id] ?? String(p.stock)
                  return (
                    <tr key={p.id} className="border-b border-pb-gray-border last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.image || '/products/placeholder.svg'} alt="" className="h-10 w-10 shrink-0 rounded-lg border border-pb-gray-border object-cover" />
                          <span className="font-medium text-pb-gray-text">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-pb-gray-muted">{p.sku || '—'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={p.isActive ? 'ACTIVE' : 'INACTIVE'} />
                        {p.available <= 0 ? (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-pb-red">
                            <Icon name="inventory" size={12} /> Out
                          </span>
                        ) : p.lowStock ? (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-pb-amber">
                            <Icon name="inventory" size={12} /> Low
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-pb-gray-text">{p.stock}</td>
                      <td className="px-4 py-3">
                        {p.reserved > 0 ? (
                          <span title="Held for orders awaiting payment confirmation" className="font-medium text-pb-gray-text">
                            {p.reserved}
                          </span>
                        ) : (
                          <span className="text-pb-gray-muted">0</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 font-semibold ${p.available <= 0 ? 'text-pb-red' : p.lowStock ? 'text-pb-amber' : 'text-pb-gray-text'}`}>
                        {p.available}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={p.reserved}
                            step="1"
                            aria-label={`Stock quantity for ${p.name}`}
                            value={draft}
                            onChange={(e) => setDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))}
                            className="w-24 rounded-lg border border-pb-gray-border px-2.5 py-1.5 text-sm outline-none focus:border-pb-green"
                          />
                          <button
                            type="button"
                            disabled={savingId === p.id || Number(draft) === p.stock}
                            onClick={() => saveStock(p)}
                            className="rounded-lg bg-pb-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-pb-green-dark disabled:opacity-40"
                          >
                            {savingId === p.id ? 'Saving…' : 'Save'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-pb-gray-muted">
            Reserved units are held for orders PowerBase has received but not yet confirmed payment on. They stay in
            your stock count but can't be sold again, and are returned automatically if the payment doesn't complete.
            Low stock is {threshold} available units or fewer.
          </p>
        </>
      )}
    </VendorLayout>
  )
}
