import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import StatusBadge from '../../components/vendor/StatusBadge.jsx'
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../../components/vendor/StateBlocks.jsx'
import Icon from '../../components/Icon.jsx'
import { api } from '../../services/api.js'

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)

  function load() {
    setLoading(true)
    setError('')
    api
      .getAdminVendors({ q: query.trim(), status: statusFilter === 'all' ? '' : statusFilter })
      .then((res) => setVendors(res.vendors || []))
      .catch((e) => setError(e.message || 'Could not load vendors'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(load, query ? 300 : 0)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, statusFilter])

  async function toggleActive(v) {
    try {
      await api.setAdminVendorStatus(v.id, !v.is_active)
      load()
    } catch (e) {
      setError(e.message || 'Could not update vendor status')
    }
  }

  async function toggleVerified(v) {
    try {
      await api.setAdminVendorVerified(v.id, !v.verified)
      load()
    } catch (e) {
      setError(e.message || 'Could not update vendor verification')
    }
  }

  return (
    <AdminLayout
      title="Vendors"
      actions={
        <button type="button" onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 rounded-lg bg-pb-navy px-3.5 py-2 text-sm font-semibold text-white hover:bg-pb-navy/90">
          <Icon name="plus" size={15} /> New vendor
        </button>
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
            placeholder="Search by store name or email…"
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
        <LoadingBlock label="Loading vendors…" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : vendors.length === 0 ? (
        <EmptyBlock icon="vendors" title="No vendors match this filter" />
      ) : (
        <div className="overflow-x-auto rounded-card border border-pb-gray-border bg-white shadow-card">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-pb-gray-border text-xs uppercase tracking-wide text-pb-gray-muted">
                <th className="px-4 py-3 font-semibold">Store</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Products</th>
                <th className="px-4 py-3 font-semibold">Orders</th>
                <th className="px-4 py-3 font-semibold">Share</th>
                <th className="px-4 py-3 font-semibold">Verified</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <tr key={v.id} className="border-b border-pb-gray-border last:border-0">
                  <td className="px-4 py-3 font-medium text-pb-gray-text">{v.store_name}</td>
                  <td className="px-4 py-3">
                    <div className="text-pb-gray-text">{v.email}</div>
                    <div className="text-xs text-pb-gray-muted">{v.phone || '—'}</div>
                  </td>
                  <td className="px-4 py-3">{Number(v.product_count || 0)}</td>
                  <td className="px-4 py-3">{Number(v.order_count || 0)}</td>
                  <td className="px-4 py-3">{Number(v.default_share_percent)}%</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleVerified(v)} type="button">
                      <StatusBadge status={v.verified ? 'VERIFIED' : 'UNVERIFIED'} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(v)} type="button">
                      <StatusBadge status={v.is_active ? 'ACTIVE' : 'INACTIVE'} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/vendors/${v.id}`} className="text-xs font-semibold text-pb-green hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && <CreateVendorModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load() }} />}
    </AdminLayout>
  )
}

function CreateVendorModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ storeName: '', email: '', phone: '', password: '', location: '', contactEmail: '', contactPhone: '', description: '', defaultSharePercent: '80' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await api.createAdminVendor({ ...form, defaultSharePercent: Number(form.defaultSharePercent) })
      onCreated()
    } catch (e) {
      setError(e.message || 'Could not create vendor')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-pb-navy/40" onClick={() => !busy && onClose()} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
        <h2 className="mb-4 text-base font-bold text-pb-gray-text">New vendor account</h2>
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm font-medium text-pb-gray-text">Store name
            <input required value={form.storeName} onChange={(e) => set('storeName', e.target.value)} className="mt-1 w-full rounded-lg border border-pb-gray-border p-2.5 text-sm" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-pb-gray-text">Login email
              <input type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} className="mt-1 w-full rounded-lg border border-pb-gray-border p-2.5 text-sm" />
            </label>
            <label className="block text-sm font-medium text-pb-gray-text">Password
              <input type="password" required minLength={8} value={form.password} onChange={(e) => set('password', e.target.value)} className="mt-1 w-full rounded-lg border border-pb-gray-border p-2.5 text-sm" />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-pb-gray-text">Phone
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} className="mt-1 w-full rounded-lg border border-pb-gray-border p-2.5 text-sm" />
            </label>
            <label className="block text-sm font-medium text-pb-gray-text">Default share %
              <input type="number" min="0" max="100" step="0.01" value={form.defaultSharePercent} onChange={(e) => set('defaultSharePercent', e.target.value)} className="mt-1 w-full rounded-lg border border-pb-gray-border p-2.5 text-sm" />
            </label>
          </div>
          <label className="block text-sm font-medium text-pb-gray-text">Location
            <input value={form.location} onChange={(e) => set('location', e.target.value)} className="mt-1 w-full rounded-lg border border-pb-gray-border p-2.5 text-sm" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-pb-gray-text">Contact email
              <input type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} className="mt-1 w-full rounded-lg border border-pb-gray-border p-2.5 text-sm" />
            </label>
            <label className="block text-sm font-medium text-pb-gray-text">Contact phone
              <input value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} className="mt-1 w-full rounded-lg border border-pb-gray-border p-2.5 text-sm" />
            </label>
          </div>
          <label className="block text-sm font-medium text-pb-gray-text">Description
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-pb-gray-border p-2.5 text-sm" />
          </label>
          {error && <p className="rounded-lg bg-pb-red/10 p-2.5 text-xs text-pb-red">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" disabled={busy} onClick={onClose} className="rounded-lg border border-pb-gray-border px-4 py-2 text-sm font-semibold text-pb-gray-text hover:bg-pb-gray-bg disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={busy} className="rounded-lg bg-pb-green px-4 py-2 text-sm font-semibold text-white hover:bg-pb-green-dark disabled:opacity-50">{busy ? 'Creating…' : 'Create vendor'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
