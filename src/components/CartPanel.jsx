import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { formatGHS, trustSectionShort } from '../data/mockData.js'
import { useCart, computeCartSummary } from '../context/CartContext.jsx'

export default function CartPanel() {
  const { items } = useCart()
  const { subtotal, platformFee, amountDueNow } = computeCartSummary(items)

  return (
    <aside className="hidden w-[250px] shrink-0 flex-col gap-4 2xl:flex" aria-label="Cart summary">
      <div className="rounded-xl border border-pb-gray-border bg-white p-4 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-extrabold text-pb-gray-text">My Cart ({items.length})</h2>
          <Link to="/cart" className="text-xs font-semibold text-pb-green hover:underline">Edit</Link>
        </div>
        {items.length === 0 ? (
          <div className="py-7 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pb-green-light text-pb-green"><Icon name="cart" size={27} /></span>
            <p className="mt-3 text-xs text-pb-gray-muted">Your cart is empty.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">{items.map((item) => (
            <li key={item.productId} className="flex items-center gap-2">
              <img src={item.productImage} alt={item.productName} className="h-11 w-11 rounded-lg bg-pb-gray-bg object-contain p-1" />
              <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold">{item.productName}</p><p className="text-[10px] text-pb-gray-muted">Qty: {item.quantity}</p></div>
              <p className="text-[11px] font-bold">{formatGHS(item.price)}</p>
            </li>
          ))}</ul>
        )}
        <div className="mt-4 flex flex-col gap-2 border-t border-pb-gray-border pt-3 text-xs">
          <div className="flex justify-between text-pb-gray-muted"><span>Subtotal</span><span>{formatGHS(subtotal)}</span></div>
          <div className="flex justify-between text-pb-gray-muted"><span>Platform Fee</span><span>{formatGHS(platformFee)}</span></div>
          <div className="flex justify-between text-pb-gray-muted"><span>Delivery Fee</span><span>To be confirmed</span></div>
          <div className="mt-1 flex justify-between border-t border-pb-gray-border pt-2 text-sm font-extrabold"><span>Amount Due Now</span><span>{formatGHS(amountDueNow)}</span></div>
        </div>
        <Link to="/cart" className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-pb-green py-2.5 text-xs font-bold text-white hover:bg-pb-green-dark">Checkout <Icon name="arrowRight" size={15} /></Link>
      </div>

      <div className="rounded-xl border border-pb-gray-border bg-white p-4 shadow-card">
        <h2 className="mb-3 text-sm font-extrabold">Why shop with PowerBase?</h2>
        <ul className="flex flex-col gap-3">
          {trustSectionShort.map((item) => <li key={item.id} className="flex items-center gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pb-green-light text-pb-green"><Icon name={item.icon} size={14} /></span><div><p className="text-[10px] font-bold">{item.title}</p><p className="text-[9px] text-pb-gray-muted">{item.description}</p></div></li>)}
        </ul>
      </div>
    </aside>
  )
}
