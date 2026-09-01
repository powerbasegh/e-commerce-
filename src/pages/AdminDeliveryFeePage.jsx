import { useEffect, useState } from 'react'
import { api } from '../services/api.js'

export default function AdminDeliveryFeePage() {
  const [orders, setOrders] = useState([])
  const [selected, setSelected] = useState(null)
  const [fee, setFee] = useState('')
  const [status, setStatus] = useState('SET')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setLoading(true); setError('')
    try { const data = await api.getAdminOrders(); setOrders(data.orders || []) } catch (e) { setError(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  function choose(order) { setSelected(order); setFee(order.delivery_fee ?? ''); setStatus(order.delivery_status === 'WAIVED' ? 'WAIVED' : order.delivery_status === 'CANCELLED' ? 'CANCELLED' : 'SET'); setMessage(''); setError('') }

  async function save(e) {
    e.preventDefault(); if (!selected) return
    setSaving(true); setMessage(''); setError('')
    try {
      const data = await api.updateDeliveryFee(selected.id, { delivery_fee: status === 'SET' ? Number(fee) : 0, quote_status: status })
      setMessage(`Delivery fee updated. New total: GHS ${Number(data.order.grandTotal).toFixed(2)}`)
      await load()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  return <div className="min-h-screen bg-pb-gray-bg p-4 lg:p-8">
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between"><div><h1 className="text-xl font-bold text-pb-gray-text">Delivery Fee Management</h1><p className="text-sm text-pb-gray-muted">Review delivery locations and set fees manually.</p></div><button onClick={load} className="rounded-lg border px-3 py-2 text-sm">Refresh</button></div>
        {loading ? <p>Loading orders…</p> : error && !selected ? <p className="text-red-600">{error}</p> : <div className="space-y-3">{orders.map(o => <button key={o.id} onClick={() => choose(o)} className={`w-full rounded-lg border p-4 text-left ${selected?.id === o.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}><div className="flex justify-between gap-3"><strong>{o.order_number}</strong><span>{o.status}</span></div><div className="mt-1 text-sm text-gray-600">{o.customer_name} · {o.city || 'No city'}, {o.area || 'No area'}</div><div className="mt-1 text-sm">Subtotal: GHS {Number(o.subtotal).toFixed(2)} · Delivery: {o.delivery_fee == null ? 'Pending' : `GHS ${Number(o.delivery_fee).toFixed(2)}`}</div></button>)}</div>}
      </section>
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">Set Delivery Fee</h2>
        {!selected ? <p className="text-sm text-gray-500">Select an order to review its delivery information.</p> : <>
          <div className="mb-5 rounded-lg bg-gray-50 p-4 text-sm"><p><b>Order:</b> {selected.order_number}</p><p><b>Recipient:</b> {selected.customer_name}</p><p><b>Phone:</b> {selected.customer_phone}</p><p><b>Address:</b> {selected.city}, {selected.area}</p><p><b>Landmark:</b> {selected.landmark || '—'}</p>{selected.latitude != null && <p><b>GPS:</b> {selected.latitude}, {selected.longitude}</p>}</div>
          <form onSubmit={save} className="space-y-4"><label className="block text-sm font-medium">Delivery Fee (GHS)<input type="number" min="0" step="0.01" required={status === 'SET'} value={fee} onChange={e => setFee(e.target.value)} className="mt-1 w-full rounded-lg border p-3" disabled={status !== 'SET'} /></label><label className="block text-sm font-medium">Quote Status<select value={status} onChange={e => setStatus(e.target.value)} className="mt-1 w-full rounded-lg border p-3"><option value="SET">SET</option><option value="WAIVED">WAIVED</option><option value="CANCELLED">CANCELLED</option></select></label>{message && <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={saving} className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Save Delivery Fee'}</button></form>
        </>}
      </section>
    </div>
  </div>
}
