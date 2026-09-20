import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import StatusBadge from '../../components/vendor/StatusBadge.jsx'
import { LoadingBlock, ErrorBlock } from '../../components/vendor/StateBlocks.jsx'
import { api } from '../../services/api.js'
import { formatGHS } from '../../data/mockData.js'

export default function AdminVendorDetailPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [shareInput, setShareInput] = useState('')
  const [shareBusy, setShareBusy] = useState(false)
  const [shareError, setShareError] = useState('')
  const [actionError, setActionError] = useState('')

  function load() {
    setLoading(true)
    setError('')
    api
      .getAdminVendor(id)
      .then((res) => {
        setData(res)
        setShareInput(String(res.vendor.default_share_percent))
      })
      .catch((e) => setError(e.message || 'Could not load this vendor'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  async function toggleActive() {
    setActionError('')
    try {
      await api.setAdminVendorStatus(id, !data.vendor.is_active)
      load()
    } catch (e) {
      setActionError(e.message || 'Could not update status')
    }
  }

  async function toggleVerified() {
    setActionError('')
    try {
      await api.setAdminVendorVerified(id, !data.vendor.verified)
      load()
    } catch (e) {
      setActionError(e.message || 'Could not update verification')
    }
  }

  async function submitShare(e) {
    e.preventDefault()
    setShareBusy(true); setShareError('')
    try {
      await api.setAdminVendorShare(id, Number(shareInput))
      load()
    } catch (e) {
      setShareError(e.message || 'Could not update settlement share')
    } finally {
      setShareBusy(false)
    }
  }

  if (loading) return <AdminLayout title="Vendor"><LoadingBlock label="Loading vendor…" /></AdminLayout>
  if (error) return <AdminLayout title="Vendor"><ErrorBlock message={error} onRetry={load} /></AdminLayout>
  if (!data) return null

  const { vendor, products, orders, earnings } = data

  return (
    <AdminLayout
      title={vendor.store_name}
      actions={<Link to="/admin/vendors" className="text-sm font-semibold text-pb-green hover:underline">Back to vendors</Link>}
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={vendor.is_active ? 'ACTIVE' : 'INACTIVE'} />
              <StatusBadge status={vendor.verified ? 'VERIFIED' : 'UNVERIFIED'} />
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <p><span className="text-pb-gray-muted">Login email: </span>{vendor.email}</p>
              <p><span className="text-pb-gray-muted">Phone: </span>{vendor.phone || '—'}</p>
              <p><span className="text-pb-gray-muted">Contact email: </span>{vendor.contact_email || '—'}</p>
              <p><span className="text-pb-gray-muted">Contact phone: </span>{vendor.contact_phone || '—'}</p>
              <p><span className="text-pb-gray-muted">Location: </span>{vendor.location || '—'}</p>
              <p><span className="text-pb-gray-muted">Rating: </span>{Number(vendor.rating).toFixed(1)}</p>
              <p><span className="text-pb-gray-muted">Joined: </span>{new Date(vendor.created_at).toLocaleDateString()}</p>
            </div>
            {vendor.description && <p className="mt-3 text-sm text-pb-gray-text">{vendor.description}</p>}
            {actionError && <p className="mt-3 rounded-lg bg-pb-red/10 p-2.5 text-xs text-pb-red">{actionError}</p>}
          </section>

          <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-bold text-pb-gray-text">Products ({products.length})</h2>
            {products.length === 0 ? (
              <p className="text-sm text-pb-gray-muted">This vendor has no products yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[440px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-pb-gray-border text-xs uppercase tracking-wide text-pb-gray-muted">
                      <th className="py-2 pr-3 font-semibold">Name</th>
                      <th className="py-2 pr-3 font-semibold">Price</th>
                      <th className="py-2 pr-3 font-semibold">Stock</th>
                      <th className="py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-pb-gray-border last:border-0">
                        <td className="py-2 pr-3 text-pb-gray-text">{p.name}</td>
                        <td className="py-2 pr-3">{formatGHS(Number(p.price))}</td>
                        <td className="py-2 pr-3">{p.stock_quantity}</td>
                        <td className="py-2"><StatusBadge status={p.is_active ? 'ACTIVE' : 'INACTIVE'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-bold text-pb-gray-text">Recent vendor orders ({orders.length})</h2>
            {orders.length === 0 ? (
              <p className="text-sm text-pb-gray-muted">No orders yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[440px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-pb-gray-border text-xs uppercase tracking-wide text-pb-gray-muted">
                      <th className="py-2 pr-3 font-semibold">Order #</th>
                      <th className="py-2 pr-3 font-semibold">Date</th>
                      <th className="py-2 pr-3 font-semibold">Subtotal</th>
                      <th className="py-2 font-semibold">Fulfilment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-pb-gray-border last:border-0">
                        <td className="py-2 pr-3 text-pb-gray-text">{o.order_number}</td>
                        <td className="py-2 pr-3 text-pb-gray-muted">{new Date(o.created_at).toLocaleDateString()}</td>
                        <td className="py-2 pr-3">{formatGHS(Number(o.subtotal))}</td>
                        <td className="py-2"><StatusBadge status={o.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-bold text-pb-gray-text">Earnings</h2>
            <div className="space-y-2 text-sm">
              <p><span className="text-pb-gray-muted">Lifetime gross: </span><span className="font-semibold text-pb-gray-text">{formatGHS(earnings.totalGross)}</span></p>
              <p><span className="text-pb-gray-muted">Paid out: </span><span className="font-semibold text-pb-green-dark">{formatGHS(earnings.paid)}</span></p>
            </div>
          </section>

          <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-bold text-pb-gray-text">Actions</h2>
            <div className="space-y-2">
              <button type="button" onClick={toggleActive} className="w-full rounded-lg border border-pb-gray-border px-4 py-2.5 text-sm font-semibold text-pb-gray-text hover:bg-pb-gray-bg">
                {vendor.is_active ? 'Deactivate vendor' : 'Activate vendor'}
              </button>
              <button type="button" onClick={toggleVerified} className="w-full rounded-lg border border-pb-gray-border px-4 py-2.5 text-sm font-semibold text-pb-gray-text hover:bg-pb-gray-bg">
                {vendor.verified ? 'Remove verification' : 'Verify vendor'}
              </button>
            </div>
          </section>

          <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
            <h2 className="mb-3 text-sm font-bold text-pb-gray-text">Default settlement share</h2>
            <p className="mb-3 text-xs text-pb-gray-muted">Applies to any product without its own vendor_share_percent override. The vendor cannot change this themselves.</p>
            <form onSubmit={submitShare} className="flex items-center gap-2">
              <input type="number" min="0" max="100" step="0.01" value={shareInput} onChange={(e) => setShareInput(e.target.value)} className="w-24 rounded-lg border border-pb-gray-border p-2.5 text-sm" />
              <span className="text-sm text-pb-gray-muted">%</span>
              <button disabled={shareBusy} className="ml-auto rounded-lg bg-pb-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{shareBusy ? 'Saving…' : 'Save'}</button>
            </form>
            {shareError && <p className="mt-2 rounded-lg bg-pb-red/10 p-2.5 text-xs text-pb-red">{shareError}</p>}
          </section>
        </div>
      </div>
    </AdminLayout>
  )
}
