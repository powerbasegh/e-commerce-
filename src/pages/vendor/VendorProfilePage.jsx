import { useEffect, useState } from 'react'
import VendorLayout from '../../components/vendor/VendorLayout.jsx'
import StatusBadge from '../../components/vendor/StatusBadge.jsx'
import { LoadingBlock, ErrorBlock } from '../../components/vendor/StateBlocks.jsx'
import { api } from '../../services/api.js'

export default function VendorProfilePage() {
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [form, setForm] = useState({
    storeName: '', location: '', contactEmail: '', contactPhone: '', description: '',
    payout: { method: '', accountName: '', accountNumber: '', bankName: '' },
  })

  function load() {
    setLoading(true)
    setError('')
    api
      .getVendorProfile()
      .then((res) => {
        setVendor(res.vendor)
        setForm({
          storeName: res.vendor.storeName || '',
          location: res.vendor.location || '',
          contactEmail: res.vendor.contactEmail || '',
          contactPhone: res.vendor.contactPhone || '',
          description: res.vendor.description || '',
          payout: {
            method: res.vendor.payout?.method || '',
            accountName: res.vendor.payout?.accountName || '',
            accountNumber: res.vendor.payout?.accountNumber || '',
            bankName: res.vendor.payout?.bankName || '',
          },
        })
      })
      .catch((e) => setError(e.message || 'Could not load your profile'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function updatePayout(field, value) {
    setForm((p) => ({ ...p, payout: { ...p.payout, [field]: value } }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setSaveMessage('')
    setError('')
    try {
      const res = await api.updateVendorProfile(form)
      setSaveMessage('Profile updated successfully')
      // Take the saved record back from the server rather than assuming the
      // submitted form was applied — admin-controlled fields are unchanged by
      // this request and the server's copy is the truthful one.
      if (res.vendor) setVendor(res.vendor)
    } catch (err) {
      setError(err.message || 'Could not save your profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <VendorLayout title="Store Profile">
      {loading ? (
        <LoadingBlock label="Loading your profile…" />
      ) : !vendor ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 lg:col-span-2">
            <div className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
              <h2 className="mb-4 text-sm font-semibold text-pb-gray-text">Business Information</h2>
              <div className="flex flex-col gap-4">
                <Field label="Store name" required>
                  <input required value={form.storeName} onChange={(e) => setForm((p) => ({ ...p, storeName: e.target.value }))} className="input" />
                </Field>
                <Field label="Location">
                  <input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} className="input" placeholder="e.g. Kumasi, Ashanti" />
                </Field>
                <Field label="Store description">
                  <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} className="input resize-none" />
                </Field>
              </div>
            </div>

            <div className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
              <h2 className="mb-4 text-sm font-semibold text-pb-gray-text">Contact Information</h2>
              <p className="mb-3 text-xs text-pb-gray-muted">Used internally by PowerBase to reach you — never shown to customers.</p>
              <div className="flex flex-col gap-4">
                <Field label="Contact email">
                  <input type="email" value={form.contactEmail} onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))} className="input" />
                </Field>
                <Field label="Contact phone">
                  <input value={form.contactPhone} onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))} className="input" />
                </Field>
              </div>
            </div>

            <div className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
              <h2 className="mb-1 text-sm font-semibold text-pb-gray-text">Payout Details</h2>
              <p className="mb-4 text-xs text-pb-gray-muted">
                Where PowerBase sends your settlement payouts. Only PowerBase sees this.
              </p>
              <div className="flex flex-col gap-4">
                <Field label="Payout method">
                  <select value={form.payout.method} onChange={(e) => updatePayout('method', e.target.value)} className="input">
                    <option value="">Not set</option>
                    <option value="MOMO_MTN">MTN Mobile Money</option>
                    <option value="MOMO_TELECEL">Telecel Cash</option>
                    <option value="MOMO_AT">AT Money</option>
                    <option value="BANK">Bank transfer</option>
                  </select>
                </Field>

                {form.payout.method && (
                  <>
                    <Field label="Account name" required>
                      <input
                        value={form.payout.accountName}
                        onChange={(e) => updatePayout('accountName', e.target.value)}
                        className="input"
                        placeholder="Name registered on the account"
                      />
                    </Field>
                    <Field label={form.payout.method === 'BANK' ? 'Account number' : 'Mobile money number'} required>
                      <input
                        value={form.payout.accountNumber}
                        onChange={(e) => updatePayout('accountNumber', e.target.value)}
                        className="input"
                        inputMode="numeric"
                      />
                    </Field>
                    {form.payout.method === 'BANK' && (
                      <Field label="Bank name" required>
                        <input
                          value={form.payout.bankName}
                          onChange={(e) => updatePayout('bankName', e.target.value)}
                          className="input"
                        />
                      </Field>
                    )}
                  </>
                )}
              </div>
            </div>

            {saveMessage && <p className="rounded-lg bg-pb-green-light px-3 py-2 text-sm text-pb-green-dark">{saveMessage}</p>}
            {error && <p className="rounded-lg bg-pb-red/10 px-3 py-2 text-sm text-pb-red">{error}</p>}

            <button type="submit" disabled={saving} className="self-start rounded-lg bg-pb-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-pb-green-dark disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>

          <div className="flex flex-col gap-5">
            <div className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
              <h2 className="mb-3 text-sm font-semibold text-pb-gray-text">Account Status</h2>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-pb-gray-muted">Verification</span>
                  <StatusBadge status={vendor.verified ? 'VERIFIED' : 'UNVERIFIED'} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-pb-gray-muted">Account</span>
                  <StatusBadge status={vendor.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-pb-gray-muted">Default settlement share</span>
                  <span className="font-semibold text-pb-gray-text">{vendor.defaultSharePercent}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-pb-gray-muted">Payout details</span>
                  <span className={vendor.payout?.method ? 'font-semibold text-pb-green-dark' : 'font-semibold text-pb-amber'}>
                    {vendor.payout?.method ? 'On file' : 'Not set'}
                  </span>
                </div>
              </div>
              <p className="mt-4 text-xs text-pb-gray-muted">Verification, account status, and your settlement share are managed by PowerBase and can't be changed here.</p>
            </div>
          </div>
        </div>
      )}
    </VendorLayout>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-pb-gray-text">
        {label}
        {required && <span className="text-pb-red"> *</span>}
      </span>
      {children}
    </label>
  )
}
