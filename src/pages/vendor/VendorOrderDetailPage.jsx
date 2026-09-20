import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import VendorLayout from '../../components/vendor/VendorLayout.jsx'
import StatusBadge from '../../components/vendor/StatusBadge.jsx'
import ConfirmDialog from '../../components/vendor/ConfirmDialog.jsx'
import { LoadingBlock, ErrorBlock } from '../../components/vendor/StateBlocks.jsx'
import Icon from '../../components/Icon.jsx'
import { api } from '../../services/api.js'
import { formatGHS } from '../../data/mockData.js'

// Labels only. Which transitions are actually offered comes from the server
// (vendorOrder.availableTransitions), which re-validates every one of them —
// this map never decides what a vendor is allowed to do.
//
// OUT_FOR_DELIVERY and DELIVERED are absent on purpose: PowerBase runs the
// last mile and confirms delivery, and delivery is what releases a vendor's
// settlement payout.
const ACTION_LABELS = {
  PROCESSING: { label: 'Start Processing', tone: 'primary', confirm: null },
  READY_FOR_DELIVERY: { label: 'Mark Ready for Delivery', tone: 'primary', confirm: null },
  CANCELLED: {
    label: 'Cancel This Order',
    tone: 'danger',
    confirm: {
      title: 'Cancel your part of this order?',
      description:
        "PowerBase will be notified that you can't fulfil these items and the stock you were holding goes back to your inventory. This can't be undone.",
      confirmLabel: 'Yes, cancel it',
    },
  },
}

// Vendor-side fulfilment only. The stages after READY_FOR_DELIVERY belong to
// PowerBase and are shown greyed so the vendor can see where handover sits.
const VENDOR_STAGES = ['PENDING', 'PROCESSING', 'READY_FOR_DELIVERY']
const POWERBASE_STAGES = ['OUT_FOR_DELIVERY', 'DELIVERED']
const ALL_STAGES = [...VENDOR_STAGES, ...POWERBASE_STAGES]

export default function VendorOrderDetailPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [updating, setUpdating] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  function load() {
    setLoading(true)
    setError('')
    api
      .getVendorOrderDetail(id)
      .then(setData)
      .catch((e) => setError(e.message || 'Could not load this order'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  async function applyStatus(nextStatus) {
    setUpdating(true)
    setError('')
    setNotice('')
    try {
      const res = await api.updateVendorOrderStatus(id, nextStatus)
      // Trust the server's response, including which actions remain available,
      // rather than guessing the next state in the browser.
      setData((prev) => ({
        ...prev,
        vendorOrder: {
          ...prev.vendorOrder,
          status: res.vendorOrder.status,
          availableTransitions: res.vendorOrder.availableTransitions || [],
        },
      }))
      setNotice('Order updated successfully')
    } catch (e) {
      setError(e.message || 'Could not update this order')
    } finally {
      setUpdating(false)
      setPendingAction(null)
    }
  }

  function requestAction(status) {
    const meta = ACTION_LABELS[status]
    if (meta?.confirm) setPendingAction(status)
    else applyStatus(status)
  }

  const order = data?.vendorOrder
  const transitions = order?.availableTransitions || []
  const currentIndex = ALL_STAGES.indexOf(order?.status)

  return (
    <VendorLayout title="Order Details">
      <Link to="/vendor/orders" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-pb-gray-muted hover:text-pb-gray-text">
        <Icon name="chevronLeft" size={16} />
        Back to orders
      </Link>

      {loading ? (
        <LoadingBlock label="Loading order…" />
      ) : !data ? (
        <ErrorBlock message={error || 'Order not found'} onRetry={load} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-5 lg:col-span-2">
            <div className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-pb-gray-muted">PowerBase Order</p>
                  <p className="text-lg font-bold text-pb-gray-text">{order.order_number}</p>
                  <p className="mt-0.5 text-xs text-pb-gray-muted">
                    Placed {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              {order.status !== 'CANCELLED' && (
                <div>
                  <div className="flex items-center gap-1">
                    {ALL_STAGES.map((step, i) => (
                      <div
                        key={step}
                        className={`h-1.5 flex-1 rounded-full ${
                          currentIndex >= i ? 'bg-pb-green' : 'bg-pb-gray-border'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-5 gap-1 text-[10px] leading-tight">
                    {ALL_STAGES.map((step) => (
                      <span
                        key={step}
                        className={`text-center ${
                          POWERBASE_STAGES.includes(step) ? 'text-pb-gray-muted/70' : 'text-pb-gray-muted'
                        }`}
                      >
                        {step.replaceAll('_', ' ')}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-pb-gray-muted">
                    The last two stages are handled by PowerBase after you hand the items over.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
              <h2 className="mb-3 text-sm font-semibold text-pb-gray-text">
                Items to Fulfil ({data.items.length})
              </h2>
              <div className="flex flex-col divide-y divide-pb-gray-border">
                {data.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="flex min-w-0 items-center gap-3">
                      <img
                        src={item.image_url || '/products/placeholder.svg'}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-lg border border-pb-gray-border object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-pb-gray-text">{item.product_name}</p>
                        <p className="text-xs text-pb-gray-muted">
                          {item.sku ? `SKU ${item.sku} · ` : ''}
                          {item.quantity} × {formatGHS(Number(item.unit_price))}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 font-semibold text-pb-gray-text">{formatGHS(Number(item.line_total))}</p>
                  </div>
                ))}
              </div>
            </div>

            {(order.city || order.area) && (
              <div className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
                <h2 className="mb-2 text-sm font-semibold text-pb-gray-text">Fulfilment Area</h2>
                <p className="text-sm text-pb-gray-text">
                  {[order.area, order.city].filter(Boolean).join(', ')}
                  {order.landmark ? ` — near ${order.landmark}` : ''}
                </p>
                {order.instructions && (
                  <p className="mt-2 text-sm text-pb-gray-text">
                    <span className="text-pb-gray-muted">Notes: </span>
                    {order.instructions}
                  </p>
                )}
                <p className="mt-2 text-xs text-pb-gray-muted">
                  PowerBase delivers to the customer's exact address — this is for planning your fulfilment only.
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
              <h2 className="mb-3 text-sm font-semibold text-pb-gray-text">Your Earnings</h2>
              <div className="flex flex-col gap-2 text-sm">
                <Row label="Your subtotal" value={formatGHS(Number(order.subtotal))} />
                <Row
                  label="Your gross"
                  value={order.vendor_gross != null ? formatGHS(Number(order.vendor_gross)) : '—'}
                  strong
                />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-pb-gray-muted">Settlement</span>
                  {order.settlement_status ? <StatusBadge status={order.settlement_status} /> : <span>—</span>}
                </div>
              </div>
            </div>

            <div className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
              <h2 className="mb-3 text-sm font-semibold text-pb-gray-text">Update Status</h2>

              {!order.paymentConfirmed && !['CANCELLED', 'DELIVERED'].includes(order.status) && (
                <p className="mb-3 rounded-lg bg-pb-amber/10 px-3 py-2.5 text-xs text-pb-amber">
                  PowerBase has not confirmed payment for this order yet. Your stock is being held, but don't
                  start fulfilling until this clears.
                </p>
              )}

              {transitions.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {transitions.map((status) => {
                    const meta = ACTION_LABELS[status] || { label: status.replaceAll('_', ' '), tone: 'primary' }
                    return (
                      <button
                        key={status}
                        type="button"
                        disabled={updating}
                        onClick={() => requestAction(status)}
                        className={`rounded-lg px-3 py-2.5 text-sm font-semibold disabled:opacity-50 ${
                          meta.tone === 'danger'
                            ? 'border border-pb-red/30 text-pb-red hover:bg-pb-red/5'
                            : 'bg-pb-green text-white hover:bg-pb-green-dark'
                        }`}
                      >
                        {meta.label}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-pb-gray-muted">
                  {order.status === 'READY_FOR_DELIVERY'
                    ? 'Nothing more to do — PowerBase will collect these items and handle delivery.'
                    : order.status === 'CANCELLED'
                      ? 'This order was cancelled.'
                      : order.status === 'DELIVERED'
                        ? 'This order has been delivered by PowerBase.'
                        : 'There are no actions available on this order right now.'}
                </p>
              )}
            </div>

            {notice && <p className="rounded-lg bg-pb-green-light px-3 py-2 text-sm text-pb-green-dark">{notice}</p>}
            {error && <p className="rounded-lg bg-pb-red/10 px-3 py-2 text-sm text-pb-red">{error}</p>}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingAction)}
        busy={updating}
        tone={ACTION_LABELS[pendingAction]?.tone === 'danger' ? 'danger' : 'default'}
        title={ACTION_LABELS[pendingAction]?.confirm?.title || 'Are you sure?'}
        description={ACTION_LABELS[pendingAction]?.confirm?.description}
        confirmLabel={ACTION_LABELS[pendingAction]?.confirm?.confirmLabel || 'Confirm'}
        onConfirm={() => applyStatus(pendingAction)}
        onCancel={() => setPendingAction(null)}
      />
    </VendorLayout>
  )
}

function Row({ label, value, strong }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-pb-gray-muted">{label}</span>
      <span className={strong ? 'font-semibold text-pb-green-dark' : 'text-pb-gray-text'}>{value}</span>
    </div>
  )
}
