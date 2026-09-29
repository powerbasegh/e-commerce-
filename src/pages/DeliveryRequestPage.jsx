import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AccountLayout from '../components/account/AccountLayout.jsx'
import { api } from '../services/api.js'

const initial={pickupName:'',pickupPhone:'',pickupAddress:'',destinationName:'',destinationPhone:'',destinationAddress:'',packageDescription:'',packageSize:'MEDIUM',deliveryType:'STANDARD',scheduledAt:''}
const statusLabel=s=>String(s||'').replaceAll('_',' ')
export default function DeliveryRequestPage(){
 const [form,setForm]=useState(initial); const [requests,setRequests]=useState([]); const [saving,setSaving]=useState(false); const [error,setError]=useState(''); const [notice,setNotice]=useState('')
 async function load(){try{const r=await api.getMyDeliveries();setRequests(r||[])}catch(e){setError(e.message)}} useEffect(()=>{load()},[])
 const set=(k,v)=>setForm(f=>({...f,[k]:v}))
 async function submit(e){e.preventDefault();setSaving(true);setError('');setNotice('');try{await api.createDeliveryRequest(form);setForm(initial);setNotice('Delivery request submitted. PowerBase will review the route and send your delivery quote.');await load()}catch(e){setError(e.message)}finally{setSaving(false)}}
 return <AccountLayout activeId="support" title="PowerBase Delivery">
  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
   <section className="rounded-card border border-pb-gray-border bg-white p-5 shadow-card"><div className="mb-5"><h2 className="text-lg font-bold text-pb-gray-text">Send a package</h2><p className="mt-1 text-sm text-pb-gray-muted">Tell PowerBase where to collect and where to deliver. A delivery fee is quoted before payment.</p></div>
    {error&&<div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}{notice&&<div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</div>}
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium">Pickup name<input required value={form.pickupName} onChange={e=>set('pickupName',e.target.value)} className="mt-1 w-full rounded-lg border border-pb-gray-border p-3"/></label><label className="text-sm font-medium">Pickup phone<input required value={form.pickupPhone} onChange={e=>set('pickupPhone',e.target.value)} className="mt-1 w-full rounded-lg border border-pb-gray-border p-3"/></label></div>
      <label className="block text-sm font-medium">Pickup address<textarea required rows="3" value={form.pickupAddress} onChange={e=>set('pickupAddress',e.target.value)} className="mt-1 w-full rounded-lg border border-pb-gray-border p-3"/></label>
      <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium">Recipient name<input required value={form.destinationName} onChange={e=>set('destinationName',e.target.value)} className="mt-1 w-full rounded-lg border border-pb-gray-border p-3"/></label><label className="text-sm font-medium">Recipient phone<input required value={form.destinationPhone} onChange={e=>set('destinationPhone',e.target.value)} className="mt-1 w-full rounded-lg border border-pb-gray-border p-3"/></label></div>
      <label className="block text-sm font-medium">Destination address<textarea required rows="3" value={form.destinationAddress} onChange={e=>set('destinationAddress',e.target.value)} className="mt-1 w-full rounded-lg border border-pb-gray-border p-3"/></label>
      <div className="grid gap-4 md:grid-cols-3"><label className="text-sm font-medium md:col-span-2">Package description<input required value={form.packageDescription} onChange={e=>set('packageDescription',e.target.value)} placeholder="e.g. documents, small electronics" className="mt-1 w-full rounded-lg border border-pb-gray-border p-3"/></label><label className="text-sm font-medium">Size<select value={form.packageSize} onChange={e=>set('packageSize',e.target.value)} className="mt-1 w-full rounded-lg border border-pb-gray-border bg-white p-3"><option>SMALL</option><option>MEDIUM</option><option>LARGE</option></select></label></div>
      <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium">Delivery type<select value={form.deliveryType} onChange={e=>set('deliveryType',e.target.value)} className="mt-1 w-full rounded-lg border border-pb-gray-border bg-white p-3"><option value="STANDARD">Standard</option><option value="SCHEDULED">Scheduled</option><option value="INTERCITY">Intercity</option></select></label>{form.deliveryType==='SCHEDULED'&&<label className="text-sm font-medium">Scheduled time<input required type="datetime-local" value={form.scheduledAt} onChange={e=>set('scheduledAt',e.target.value)} className="mt-1 w-full rounded-lg border border-pb-gray-border p-3"/></label>}</div>
      <button disabled={saving} className="w-full rounded-lg bg-pb-green px-4 py-3 font-semibold text-white disabled:opacity-50">{saving?'Submitting…':'Request delivery quote'}</button>
    </form>
   </section>
   <section className="rounded-card border border-pb-gray-border bg-white shadow-card"><div className="border-b border-pb-gray-border p-5"><h2 className="font-bold text-pb-gray-text">My delivery requests</h2></div><div className="divide-y divide-pb-gray-border">{requests.length===0?<p className="p-5 text-sm text-pb-gray-muted">No delivery requests yet.</p>:requests.map(r=><div key={r.id} className="p-5"><div className="flex items-center justify-between gap-3"><b className="text-sm text-pb-gray-text">Delivery #{r.id}</b><span className="text-xs font-semibold uppercase text-pb-green">{statusLabel(r.status)}</span></div><p className="mt-2 text-sm text-pb-gray-muted">{r.pickupAddress} → {r.destinationAddress}</p>{r.quotedFee!=null&&<p className="mt-2 text-sm font-semibold">Quote: GHS {Number(r.quotedFee).toFixed(2)}</p>}{r.riderName&&<p className="mt-1 text-xs text-pb-gray-muted">Rider: {r.riderName} · {r.riderPhone}</p>}</div>)}</div></section>
  </div>
 </AccountLayout>
}
