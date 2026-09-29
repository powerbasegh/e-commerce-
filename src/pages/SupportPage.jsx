import { useEffect, useState } from 'react'
import AccountLayout from '../components/account/AccountLayout.jsx'
import Icon from '../components/Icon.jsx'
import { api } from '../services/api.js'

const categories = [
  ['ORDER', 'Order issue'], ['PAYMENT', 'Payment'], ['DELIVERY', 'Delivery'],
  ['PRODUCT', 'Product'], ['ACCOUNT', 'Account'], ['OTHER', 'Other'],
]

export default function SupportPage() {
  const [tickets, setTickets] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ subject: '', category: 'ORDER', orderNumber: '', message: '' })
  const [reply, setReply] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  async function load() {
    setLoading(true); setError('')
    try { const res = await api.getSupportTickets(); setTickets(res.tickets || []) }
    catch (e) { setError(e.message || 'Could not load support tickets') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function openTicket(id) {
    try { setSelected(await api.getSupportTicket(id)); setNotice('') }
    catch (e) { setError(e.message || 'Could not open ticket') }
  }

  async function create(e) {
    e.preventDefault(); setSaving(true); setError(''); setNotice('')
    try {
      const res = await api.createSupportTicket(form)
      setForm({ subject: '', category: 'ORDER', orderNumber: '', message: '' })
      await load(); await openTicket(res.ticket.id); setNotice('Your support request has been sent.')
    } catch (e) { setError(e.message || 'Could not create ticket') }
    finally { setSaving(false) }
  }

  async function sendReply(e) {
    e.preventDefault(); if (!reply.trim() || !selected) return
    setSaving(true); setError('')
    try { await api.replySupportTicket(selected.ticket.id, reply); setReply(''); await openTicket(selected.ticket.id); await load() }
    catch (e) { setError(e.message || 'Could not send reply') }
    finally { setSaving(false) }
  }

  return (
    <AccountLayout activeId="support" title="PowerBase Support">
      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-pb-green-light text-pb-green"><Icon name="support" size={20} /></span>
            <div><h2 className="font-bold text-pb-gray-text">Start a request</h2><p className="text-xs text-pb-gray-muted">Talk to PowerBase support.</p></div>
          </div>
          <form onSubmit={create} className="space-y-3">
            <input required minLength={3} value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="What do you need help with?" className="w-full rounded-lg border border-pb-gray-border px-3 py-2.5 text-sm outline-none focus:border-pb-green" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-pb-gray-border bg-white px-3 py-2.5 text-sm outline-none focus:border-pb-green">
              {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <input value={form.orderNumber} onChange={e => setForm({ ...form, orderNumber: e.target.value })} placeholder="Order number (optional)" className="w-full rounded-lg border border-pb-gray-border px-3 py-2.5 text-sm outline-none focus:border-pb-green" />
            <textarea required minLength={5} rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Describe the issue…" className="w-full resize-none rounded-lg border border-pb-gray-border px-3 py-2.5 text-sm outline-none focus:border-pb-green" />
            <button disabled={saving} className="w-full rounded-lg bg-pb-green px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Sending…' : 'Send to PowerBase'}</button>
          </form>
        </section>

        <section className="min-w-0">
          {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {notice && <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>}
          <div className="grid gap-3 md:grid-cols-[280px_minmax(0,1fr)]">
            <div className="rounded-card border border-pb-gray-border bg-white shadow-card">
              <div className="border-b border-pb-gray-border p-4"><h2 className="font-bold text-pb-gray-text">Your requests</h2></div>
              {loading ? <p className="p-4 text-sm text-pb-gray-muted">Loading…</p> : tickets.length === 0 ? <p className="p-4 text-sm text-pb-gray-muted">No support requests yet.</p> : tickets.map(t => (
                <button key={t.id} onClick={() => openTicket(t.id)} className={`block w-full border-b border-pb-gray-border p-4 text-left last:border-0 ${selected?.ticket?.id === t.id ? 'bg-pb-green-light/50' : 'hover:bg-pb-gray-bg'}`}>
                  <div className="text-xs font-semibold text-pb-green">{t.ticket_number}</div><div className="mt-1 line-clamp-2 text-sm font-semibold text-pb-gray-text">{t.subject}</div><div className="mt-1 text-xs text-pb-gray-muted">{t.status.replaceAll('_',' ')}</div>
                </button>
              ))}
            </div>
            <div className="rounded-card border border-pb-gray-border bg-white shadow-card">
              {!selected ? <div className="flex min-h-[360px] flex-col items-center justify-center p-8 text-center"><Icon name="support" size={28} className="text-pb-gray-muted" /><h2 className="mt-3 font-bold text-pb-gray-text">Select a request</h2><p className="mt-1 max-w-sm text-sm text-pb-gray-muted">Your conversation with PowerBase support will appear here.</p></div> : <>
                <div className="border-b border-pb-gray-border p-4"><div className="text-xs font-semibold text-pb-green">{selected.ticket.ticket_number}</div><h2 className="mt-1 font-bold text-pb-gray-text">{selected.ticket.subject}</h2><p className="mt-1 text-xs text-pb-gray-muted">{selected.ticket.status.replaceAll('_',' ')} · {selected.ticket.category}</p></div>
                <div className="max-h-[430px] space-y-3 overflow-y-auto p-4">{selected.messages.map(m => <div key={m.id} className={`max-w-[85%] rounded-lg px-3 py-2.5 text-sm ${m.is_mine ? 'ml-auto bg-pb-green text-white' : 'bg-pb-gray-bg text-pb-gray-text'}`}><p className="whitespace-pre-wrap">{m.body}</p><p className={`mt-1 text-[10px] ${m.is_mine ? 'text-white/70' : 'text-pb-gray-muted'}`}>{m.is_mine ? 'You' : 'PowerBase Support'} · {new Date(m.created_at).toLocaleString()}</p></div>)}</div>
                {selected.ticket.status !== 'CLOSED' && <form onSubmit={sendReply} className="border-t border-pb-gray-border p-4"><div className="flex gap-2"><textarea required value={reply} onChange={e => setReply(e.target.value)} rows={2} placeholder="Write a reply…" className="min-w-0 flex-1 resize-none rounded-lg border border-pb-gray-border px-3 py-2 text-sm outline-none focus:border-pb-green" /><button disabled={saving} className="self-end rounded-lg bg-pb-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Send</button></div></form>}
              </>}
            </div>
          </div>
        </section>
      </div>
    </AccountLayout>
  )
}
