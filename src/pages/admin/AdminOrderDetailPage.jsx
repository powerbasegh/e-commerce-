import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import StatusBadge from '../../components/vendor/StatusBadge.jsx'
import { LoadingBlock, ErrorBlock } from '../../components/vendor/StateBlocks.jsx'
import Icon from '../../components/Icon.jsx'
import { api } from '../../services/api.js'
import { formatGHS } from '../../data/mockData.js'

// Kept in lockstep with server/src/controllers/adminController.js
// ADMIN_ORDER_STATUSES — these are the only statuses PowerBase writes
// directly. PROCESSING and READY_FOR_DELIVERY are vendor-derived (they come
// from vendor sub-order actions via orderStateService, never from an admin
// write) and CONFIRMED is set only by payment confirmation, so none of the
// three belong in this list — offering them here would let the UI request a
// transition the backend now rejects.
const ADMIN_ORDER_STATUSES = ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']

export default function AdminOrderDetailPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Payment confirmation form
  const [payStatus, setPayStatus] = useState('PAID')
  const [provider, setProvider] = useState('')
  const [reference, setReference] = useState('')
  const [payBusy, setPayBusy] = useState(false)
  const [payError, setPayError] = useState('')
  const [payMessage, setPayMessage] = useState('')

  // Order status transition
  const [nextStatus, setNextStatus] = useState('')
  const [statusBusy, setStatusBusy] = useState(false)
  const [statusError, setStatusError] = useState('')

  function load() {
    setLoading(true)
    setError('')
    api
      .getAdminOrder(id)
      .then((res) => {
        setData(res)
        // The order's current status is usually vendor-derived (CONFIRMED,
        // PROCESSING, READY_FOR_DELIVERY) and isn't one Admin can select —
        // default the picker to the next state Admin is actually allowed to
        // set, rather than a value the <select> can't represent, and skip
        // OUT_FOR_DELIVERY as the default when the order isn't ready for it.
        const active = (res.vendorOrders || []).filter((v) => v.status !== 'CANCELLED')
        const ready = active.length > 0 && active.every((v) => v.status === 'READY_FOR_DELIVERY')
        if (res.order.status === 'OUT_FOR_DELIVERY') setNextStatus('DELIVERED')
        else if (ready) setNextStatus('OUT_FOR_DELIVERY')
        else setNextStatus('CANCELLED')
      })
      .catch((e) => setError(e.message || 'Could not load this order'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  async function submitPayment(e) {
    e.preventDefault()
    setPayBusy(true); setPayError(''); setPayMessage('')
    try {
      await api.confirmAdminOrderPayment(id, {
        status: payStatus,
        provider: provider.trim(),
        transactionReference: reference.trim(),
      })
      setPayMessage(`Payment recorded as ${payStatus}.`)
      setReference('')
      load()
    } catch (e) {
      setPayError(e.message || 'Could not record payment')
    } finally {
      setPayBusy(false)
    }
  }

  async function submitStatus(e) {
    e.preventDefault()
    setStatusBusy(true); setStatusError('')
    try {
      await api.updateAdminOrderStatus(id, nextStatus)
      load()
    } catch (e) {
      setStatusError(e.message || 'Could not update order status')
    } finally {
      setStatusBusy(false)
    }
  }

  if (loading) return <AdminLayout title="Order"><LoadingBlock label="Loading order…" /></AdminLayout>
  if (error) return <AdminLayout title="Order"><ErrorBlock message={error} onRetry={load} /></AdminLayout>
  if (!data) return null

  const { order, vendorOrders, items, events, delivery } = data
  // Mirrors server/src/services/orderStateService.js isReadyForDelivery() —
  // same "every active vendor_orders row is READY_FOR_DELIVERY" rule — so
  // this option is disabled here for the same reason the backend would
  // reject it. The backend re-checks this itself on submit regardless; this
  // is UI guidance, not the authority.
  const activeVendorOrders = vendorOrders.filter((v) => v.status !== 'CANCELLED')
  const readyForDelivery = activeVendorOrders.length > 0 && activeVendorOrders.every((v) => v.status === 'READY_FOR_DELIVERY')
  const totalMargin = vendorOrders.reduce((s, v) => s + Number(v.powerbase_margin || 0), 0)
  const totalVendorGross = vendorOrders.reduce((s, v) => s + Number(v.vendor_gross || 0), 0)

  return (
    <AdminLayout
      title={order.order_number}
      actions={<Link to="/admin/orders" className="text-sm font-semibold text-pb-green hover:underline">Back to orders</Link>}
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {/* Order summary */}
          <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs text-pb-gray-muted">Placed {new Date(order.created_at).toLocaleString()}</p>
                <p className="mt-1 text-sm text-pb-gray-text">{order.customer_name} · {order.customer_email} · {order.customer_phone}</p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div><p className="text-pb-gray-muted">Subtotal</p><p className="font-semibold text-pb-gray-text">{formatGHS(Number(order.subtotal))}</p></div>
              <div><p className="text-pb-gray-muted">Platform fee</p><p className="font-semibold text-pb-gray-text">{formatGHS(Number(order.platform_fee))}</p></div>
              <div><p className="text-pb-gray-muted">Delivery fee</p><p className="font-semibold text-pb-gray-text">{order.delivery_fee == null ? 'Pending' : formatGHS(Number(order.delivery_fee))}</p></div>
              <div><p className="text-pb-gray-muted">Grand total</p><p className="font-bold text-pb-gray-text">{formatGHS(Number(order.grand_total))}</p></div>
            </div>
          </section>

          {/* Vendor orders */}
          <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-bold text-pb-gray-text">Vendor breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-pb-gray-border text-xs uppercase tracking-wide text-pb-gray-muted">
                    <th className="py-2 pr-3 font-semibold">Vendor</th>
                    <th className="py-2 pr-3 font-semibold">Subtotal</th>
                    <th className="py-2 pr-3 font-semibold">Fulfilment</th>
                    <th className="py-2 pr-3 font-semibold">Vendor gross</th>
                    <th className="py-2 pr-3 font-semibold">Margin</th>
                    <th className="py-2 font-semibold">Settlement</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorOrders.map((v) => (
                    <tr key={v.id} className="border-b border-pb-gray-border last:border-0">
                      <td className="py-2 pr-3 text-pb-gray-text">{v.store_name}</td>
                      <td className="py-2 pr-3">{formatGHS(Number(v.subtotal))}</td>
                      <td className="py-2 pr-3"><StatusBadge status={v.status} /></td>
                      <td className="py-2 pr-3 text-pb-green-dark">{v.vendor_gross != null ? formatGHS(Number(v.vendor_gross)) : '—'}</td>
                      <td className="py-2 pr-3 font-medium text-pb-navy">{v.powerbase_margin != null ? formatGHS(Number(v.powerbase_margin)) : '—'}</td>
                      <td className="py-2">{v.settlement_status ? <StatusBadge status={v.settlement_status} /> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
                {vendorOrders.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-pb-gray-border text-sm font-semibold">
                      <td className="py-2 pr-3 text-pb-gray-text" colSpan={3}>Total</td>
                      <td className="py-2 pr-3 text-pb-green-dark">{formatGHS(totalVendorGross)}</td>
                      <td className="py-2 pr-3 text-pb-navy">{formatGHS(totalMargin)}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>

          {/* Items */}
          <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-bold text-pb-gray-text">Items</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-pb-gray-border text-xs uppercase tracking-wide text-pb-gray-muted">
                    <th className="py-2 pr-3 font-semibold">Product</th>
                    <th className="py-2 pr-3 font-semibold">Unit price</th>
                    <th className="py-2 pr-3 font-semibold">Qty</th>
                    <th className="py-2 pr-3 font-semibold">Line total</th>
                    <th className="py-2 font-semibold">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-b border-pb-gray-border last:border-0">
                      <td className="py-2 pr-3 text-pb-gray-text">{it.product_name}</td>
                      <td className="py-2 pr-3">{formatGHS(Number(it.unit_price))}</td>
                      <td className="py-2 pr-3">{it.quantity}</td>
                      <td className="py-2 pr-3 font-medium">{formatGHS(Number(it.line_total))}</td>
                      <td className="py-2 text-xs text-pb-gray-muted">{it.stock_state}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Delivery */}
          <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-bold text-pb-gray-text">Delivery</h2>
            {!delivery ? (
              <p className="text-sm text-pb-gray-muted">No delivery quote on file for this order.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <p><span className="text-pb-gray-muted">Recipient: </span>{delivery.recipient_name} · {delivery.recipient_phone}</p>
                <p><span className="text-pb-gray-muted">Status: </span>{delivery.status}</p>
                <p className="sm:col-span-2"><span className="text-pb-gray-muted">Address: </span>{delivery.address}, {delivery.city}, {delivery.area}</p>
                {delivery.landmark && <p><span className="text-pb-gray-muted">Landmark: </span>{delivery.landmark}</p>}
                {delivery.latitude != null && <p><span className="text-pb-gray-muted">GPS: </span>{delivery.latitude}, {delivery.longitude}</p>}
                {delivery.instructions && <p className="sm:col-span-2"><span className="text-pb-gray-muted">Instructions: </span>{delivery.instructions}</p>}
                <p><span className="text-pb-gray-muted">Fee: </span>{delivery.delivery_fee == null ? 'Not yet quoted' : formatGHS(Number(delivery.delivery_fee))}</p>
              </div>
            )}
            <Link to="/admin/delivery" className="mt-3 inline-block text-xs font-semibold text-pb-green hover:underline">Manage delivery fees →</Link>
          </section>

          {/* Events */}
          <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-bold text-pb-gray-text">Order events</h2>
            <ul className="space-y-3">
              {events.map((e, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pb-gray-bg text-pb-gray-muted">
                    <Icon name="checkCircle" size={13} />
                  </span>
                  <div>
                    <p className="font-medium text-pb-gray-text">{e.title}</p>
                    <p className="text-pb-gray-muted">{e.description}</p>
                    <p className="text-xs text-pb-gray-muted">{new Date(e.created_at).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          {/* Payment */}
          <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-bold text-pb-gray-text">Payment</h2>
            <div className="mb-4 rounded-lg bg-pb-gray-bg p-3 text-sm">
              <p><span className="text-pb-gray-muted">Status: </span><span className="font-semibold">{order.payment_status || 'PENDING'}</span></p>
              {order.provider && <p><span className="text-pb-gray-muted">Provider: </span>{order.provider}</p>}
              {order.transaction_reference && <p><span className="text-pb-gray-muted">Reference: </span>{order.transaction_reference}</p>}
              {order.paid_at && <p><span className="text-pb-gray-muted">Paid at: </span>{new Date(order.paid_at).toLocaleString()}</p>}
            </div>
            {order.payment_status === 'PAID' ? (
              <p className="text-xs text-pb-gray-muted">A confirmed payment cannot be reversed here. Record a refund through your payment provider directly if needed — refund automation is not yet integrated.</p>
            ) : (
              <form onSubmit={submitPayment} className="space-y-3">
                <p className="text-xs text-pb-gray-muted">
                  Record the real outcome from your payment provider (Paystack/Hubtel/etc.). This is the only way payments.status can become PAID — nothing in the customer or vendor apps can do this.
                </p>
                <label className="block text-sm font-medium text-pb-gray-text">
                  Outcome
                  <select value={payStatus} onChange={(e) => setPayStatus(e.target.value)} className="mt-1 w-full rounded-lg border border-pb-gray-border p-2.5 text-sm">
                    <option value="PAID">PAID</option>
                    <option value="FAILED">FAILED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-pb-gray-text">
                  Provider
                  <input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="e.g. Paystack" required={payStatus === 'PAID'} className="mt-1 w-full rounded-lg border border-pb-gray-border p-2.5 text-sm" />
                </label>
                <label className="block text-sm font-medium text-pb-gray-text">
                  Transaction reference
                  <input value={reference} onChange={(e) => setReference(e.target.value)} required={payStatus === 'PAID'} className="mt-1 w-full rounded-lg border border-pb-gray-border p-2.5 text-sm" />
                </label>
                {payError && <p className="rounded-lg bg-pb-red/10 p-2.5 text-xs text-pb-red">{payError}</p>}
                {payMessage && <p className="rounded-lg bg-pb-green-light p-2.5 text-xs text-pb-green-dark">{payMessage}</p>}
                <button disabled={payBusy} className="w-full rounded-lg bg-pb-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  {payBusy ? 'Saving…' : 'Record payment outcome'}
                </button>
              </form>
            )}
          </section>

          {/* Order status */}
          <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-bold text-pb-gray-text">Order status</h2>
            {['DELIVERED', 'CANCELLED'].includes(order.status) ? (
              <p className="text-sm text-pb-gray-muted">This order is {order.status.toLowerCase()} and cannot be moved further.</p>
            ) : (
              <form onSubmit={submitStatus} className="space-y-3">
                <label className="block text-sm font-medium text-pb-gray-text">
                  Move to
                  <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} className="mt-1 w-full rounded-lg border border-pb-gray-border p-2.5 text-sm">
                    {ADMIN_ORDER_STATUSES.map((s) => (
                      <option key={s} value={s} disabled={s === 'OUT_FOR_DELIVERY' && !readyForDelivery}>
                        {s.replaceAll('_', ' ')}{s === 'OUT_FOR_DELIVERY' && !readyForDelivery ? ' (not ready)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                {!readyForDelivery && order.status !== 'OUT_FOR_DELIVERY' && (
                  <p className="rounded-lg bg-pb-amber/10 p-2.5 text-xs text-pb-amber">
                    Not every vendor on this order has reached READY_FOR_DELIVERY yet, so OUT_FOR_DELIVERY isn't available.
                  </p>
                )}
                <p className="text-xs text-pb-gray-muted">
                  Requires payment to already be PAID. PROCESSING and READY_FOR_DELIVERY happen automatically as
                  vendors update their own sub-orders — Admin sets only OUT_FOR_DELIVERY, DELIVERED and CANCELLED.
                </p>
                {statusError && <p className="rounded-lg bg-pb-red/10 p-2.5 text-xs text-pb-red">{statusError}</p>}
                <button disabled={statusBusy} className="w-full rounded-lg border border-pb-gray-border px-4 py-2.5 text-sm font-semibold text-pb-gray-text hover:bg-pb-gray-bg disabled:opacity-50">
                  {statusBusy ? 'Updating…' : 'Update status'}
                </button>
              </form>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  )
}
