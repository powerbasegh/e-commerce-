import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../../components/vendor/StateBlocks.jsx'
import { api } from '../../services/api.js'
import { formatGHS } from '../../data/mockData.js'

// PowerBase delivery is manual: an admin reviews the customer's submitted
// location and sets a real delivery fee — there is no automatic
// GPS-distance pricing. Backed by GET/PUT /api/admin/orders/:id/delivery-fee.
export default function AdminDeliveryPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [fee, setFee] = useState('')
  const [status, setStatus] = useState('SET')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [saveError, setSaveError] = useState('')

  function load() {
    setLoading(true); setError('')
    api.getAdminOrders().then((res) => setOrders(res.orders || [])).catch((e) => setError(e.message || 'Could not load pending deliveries')).finally(() => setLoading(false))
  }

  useEffect(load, [])

  function choose(order) {
    setSelected(order)
    setFee(order.delivery_fee ?? '')
    setStatus(order.delivery_status === 'WAIVED' ? 'WAIVED' : order.delivery_status === 'CANCELLED' ? 'CANCELLED' : 'SET')
    setMessage(''); setSaveError('')
  }

  async function save(e) {
    e.preventDefault()
    if (!selected) return
    setSaving(true); setMessage(''); setSaveError('')
    try {
      const data = await api.updateDeliveryFee(selected.id, { delivery_fee: status === 'SET' ? Number(fee) : 0, quote_status: status })
      setMessage(`Delivery fee updated. New order total: ${formatGHS(Number(data.order.grandTotal))}`)
      setSelected(null)
      load()
    } catch (e) {
      setSaveError(e.message || 'Could not update the delivery fee')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout title="Delivery">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-pb-gray-text">Orders awaiting a delivery quote</h2>
              <p className="text-xs text-pb-gray-muted">Review the delivery location and set the fee manually.</p>
            </div>
            <button onClick={load} type="button" className="rounded-lg border border-pb-gray-border px-3 py-1.5 text-xs font-semibold text-pb-gray-text hover:bg-pb-gray-bg">Refresh</button>
          </div>
          {loading ? (
            <LoadingBlock label="Loading…" />
          ) : error ? (
            <ErrorBlock message={error} onRetry={load} />
          ) : orders.length === 0 ? (
            <EmptyBlock icon="truck" title="Nothing pending" description="Every submitted order has a delivery fee quote." />
          ) : (
            <div className="space-y-2">
              {orders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => choose(o)}
                  className={`w-full rounded-lg border p-3.5 text-left text-sm transition-colors ${selected?.id === o.id ? 'border-pb-green bg-pb-green-light' : 'border-pb-gray-border hover:bg-pb-gray-bg'}`}
                >
                  <div className="flex justify-between gap-3">
                    <strong className="text-pb-gray-text">{o.order_number}</strong>
                    <span className="text-xs text-pb-gray-muted">{new Date(o.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-1 text-pb-gray-muted">{o.customer_name} · {o.city || 'No city'}, {o.area || 'No area'}</div>
                  <div className="mt-1">Subtotal: {formatGHS(Number(o.subtotal))} · Delivery: {o.delivery_fee == null ? 'Pending' : formatGHS(Number(o.delivery_fee))}</div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
          <h2 className="mb-4 text-sm font-bold text-pb-gray-text">Set delivery fee</h2>
          {!selected ? (
            <p className="text-sm text-pb-gray-muted">Select an order to review its delivery information.</p>
          ) : (
            <>
              <div className="mb-5 space-y-1 rounded-lg bg-pb-gray-bg p-4 text-sm">
                <p><span className="text-pb-gray-muted">Order: </span><b>{selected.order_number}</b></p>
                <p><span className="text-pb-gray-muted">Recipient: </span>{selected.customer_name}</p>
                <p><span className="text-pb-gray-muted">Phone: </span>{selected.customer_phone}</p>
                <p><span className="text-pb-gray-muted">Address: </span>{selected.city}, {selected.area}</p>
                <p><span className="text-pb-gray-muted">Landmark: </span>{selected.landmark || '—'}</p>
                {selected.latitude != null && <p><span className="text-pb-gray-muted">GPS: </span>{selected.latitude}, {selected.longitude}</p>}
              </div>
              <form onSubmit={save} className="space-y-4">
                <label className="block text-sm font-medium text-pb-gray-text">
                  Delivery fee (GHS)
                  <input type="number" min="0" step="0.01" required={status === 'SET'} value={fee} onChange={(e) => setFee(e.target.value)} disabled={status !== 'SET'} className="mt-1 w-full rounded-lg border border-pb-gray-border p-3 text-sm disabled:bg-pb-gray-bg" />
                </label>
                <label className="block text-sm font-medium text-pb-gray-text">
                  Quote status
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded-lg border border-pb-gray-border p-3 text-sm">
                    <option value="SET">Set a fee</option>
                    <option value="WAIVED">Waive (free delivery)</option>
                    <option value="CANCELLED">Cancel this quote</option>
                  </select>
                </label>
                {message && <p className="rounded-lg bg-pb-green-light p-3 text-sm text-pb-green-dark">{message}</p>}
                {saveError && <p className="rounded-lg bg-pb-red/10 p-3 text-sm text-pb-red">{saveError}</p>}
                <button disabled={saving} className="w-full rounded-lg bg-pb-navy px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save delivery fee'}</button>
              </form>
            </>
          )}
        </section>
      </div>
    </AdminLayout>
  )
}
