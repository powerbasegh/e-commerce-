import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { formatGHS } from '../data/mockData.js'

export default function PowerBaseOrderItems({ items = [], compact = false }) {
  return (
    <section className="rounded-card border border-pb-gray-border bg-white shadow-card">
      <header className="flex items-center justify-between border-b border-pb-gray-border px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pb-green-light text-pb-green"><Icon name="cart" size={15} /></span>
          <div><p className="text-sm font-extrabold text-pb-gray-text">PowerBase Order</p><p className="text-[10px] text-pb-gray-muted">{items.length} {items.length === 1 ? 'product' : 'products'}</p></div>
        </div>
      </header>
      <div className="divide-y divide-pb-gray-border px-4 sm:px-5">
        {items.map((item) => {
          const productId = item.productId ?? item.product_id
          const name = item.productName ?? item.product_name
          const image = item.productImage ?? item.product_image ?? '/products/speaker.svg'
          const price = Number(item.price ?? item.unit_price ?? 0)
          const quantity = Number(item.quantity ?? 1)
          return (
            <div key={`${productId}-${quantity}`} className={`flex gap-3 ${compact ? 'py-3' : 'py-4'}`}>
              <Link to={`/product/${productId}`} className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[#f6f8f7] p-2 sm:h-20 sm:w-20">
                <img src={image} alt={name} className="h-full w-full object-contain" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/product/${productId}`} className="line-clamp-2 text-xs font-bold text-pb-gray-text hover:text-pb-green sm:text-sm">{name}</Link>
                <p className="mt-1 text-[10px] text-pb-gray-muted sm:text-xs">Quantity: {quantity}</p>
              </div>
              <span className="shrink-0 text-xs font-extrabold text-pb-gray-text sm:text-sm">{formatGHS(price * quantity)}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
