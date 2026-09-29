import { useState } from 'react'
import { api } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProductReviewForm({ productId, onSubmitted }) {
  const { isAuthenticated } = useAuth()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  if (!isAuthenticated) return <p className="text-sm text-pb-gray-muted">Sign in to leave a review after your order is delivered.</p>
  async function submit(e) {
    e.preventDefault(); setSaving(true); setMessage('')
    try { await api.createProductReview(productId, { rating, comment }); setComment(''); setMessage('Review submitted. Thank you.'); onSubmitted?.() }
    catch (err) { setMessage(err.message || 'Could not submit review') }
    finally { setSaving(false) }
  }
  return <form onSubmit={submit} className="flex flex-col gap-3 border-t border-pb-gray-border pt-4">
    <p className="text-sm font-semibold text-pb-gray-text">Share your experience</p>
    <div className="flex items-center gap-2"><label className="text-sm text-pb-gray-muted">Rating</label><select value={rating} onChange={e => setRating(Number(e.target.value))} className="rounded-lg border border-pb-gray-border px-3 py-2 text-sm"><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select></div>
    <textarea value={comment} onChange={e => setComment(e.target.value)} minLength={3} maxLength={2000} required rows={4} placeholder="Tell other customers about the product" className="w-full rounded-lg border border-pb-gray-border px-3 py-2 text-sm outline-none focus:border-pb-green" />
    {message && <p className="text-sm text-pb-gray-muted">{message}</p>}
    <button disabled={saving} className="self-start rounded-lg bg-pb-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Submitting…' : 'Submit review'}</button>
  </form>
}
