import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import BrandLogo from './BrandLogo.jsx'
import { categories } from '../data/mockData.js'

const COLUMNS = [
  { title: 'Shop', links: [['Flash Deals', '/flash-deals'], ['New Arrivals', '/shop'], ['Best Sellers', '/shop'], ['All Categories', '/categories']] },
  { title: 'Customer Care', links: [['Help Center', '/support'], ['Track Order', '/orders/track'], ['Returns', '/support'], ['Buyer Protection', '/buyer-protection']] },
  { title: 'PowerBase', links: [['Sell on PowerBase', '/vendor/apply'], ['About Us', '/about'], ['Contact Us', '/support']] },
]

export default function Footer() {
  return (
    <footer className="mt-6 border-t border-pb-gray-border bg-white">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-5 xl:px-6">
        <div className="sm:col-span-2">
          <BrandLogo />
          <p className="mt-4 max-w-sm text-xs leading-5 text-pb-gray-muted">A Ghana-focused online store for quality products, secure payments, buyer protection and reliable delivery.</p>
          <div className="mt-5 flex gap-2">
            {[['secure', 'Secure payments'], ['shield', 'Buyer protection'], ['truck', 'Reliable delivery']].map(([icon, label]) => (
              <span key={label} title={label} className="flex h-9 w-9 items-center justify-center rounded-full bg-pb-green-light text-pb-green"><Icon name={icon} size={16} /></span>
            ))}
          </div>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-pb-gray-text">{column.title}</p>
            <ul className="mt-4 flex flex-col gap-2.5">{column.links.map(([label, href]) => <li key={label}><Link to={href} className="text-xs text-pb-gray-muted hover:text-pb-green">{label}</Link></li>)}</ul>
          </div>
        ))}

        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-pb-gray-text">Top Categories</p>
          <ul className="mt-4 flex flex-col gap-2.5">{categories.filter((c) => c.id !== 'more').slice(0, 5).map((category) => <li key={category.id}><Link to={`/category/${category.id}`} className="text-xs text-pb-gray-muted hover:text-pb-green">{category.name}</Link></li>)}</ul>
        </div>
      </div>
      <div className="border-t border-pb-gray-border">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 py-4 text-[10px] text-pb-gray-muted sm:flex-row sm:items-center sm:justify-between xl:px-6">
          <span>© {new Date().getFullYear()} PowerBase. All rights reserved.</span>
          <span className="flex items-center gap-1.5"><Icon name="location" size={12} />Ghana</span>
        </div>
      </div>
    </footer>
  )
}
