import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { categories } from '../data/mockData.js'

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      ['Flash Deals', '/flash-deals'],
      ['New Arrivals', '/shop'],
      ['Best Sellers', '/shop'],
      ['All Categories', '/categories'],
    ],
  },
  {
    title: 'Customer Care',
    links: [
      ['Help Center', '/support'],
      ['Track Order', '/orders/track'],
      ['Returns', '/support'],
      ['Buyer Protection', '/buyer-protection'],
    ],
  },
  {
    title: 'PowerBase',
    links: [
      ['Sell on PowerBase', '/vendor/apply'],
      ['About Us', '/about'],
      ['Contact Us', '/support'],
    ],
  },
]

// Site-wide footer for the customer frontend. Rendered on the homepage
// only for now — safe to lift into every page once the rest of the
// customer frontend is redesigned.
export default function Footer() {
  return (
    <footer className="mt-6 border-t border-pb-gray-border bg-white">
      <div className="mx-auto grid max-w-[1480px] grid-cols-2 gap-8 px-5 py-10 md:grid-cols-5">
        <div className="col-span-2">
          <span className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pb-green text-base font-bold text-white">P</span>
            <span className="text-lg font-extrabold tracking-tight text-pb-gray-text">
              Power<span className="text-pb-green">Base</span>
            </span>
          </span>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-pb-gray-muted">
            Ghana's trusted online marketplace for electronics, fashion, home essentials and more — secure payments, buyer protection, and reliable delivery on every order.
          </p>
          <div className="mt-4 flex items-center gap-3 text-pb-gray-muted">
            <Icon name="lock" size={16} className="text-pb-green" />
            <Icon name="shield" size={16} className="text-pb-green" />
            <Icon name="truck" size={16} className="text-pb-green" />
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-xs font-bold uppercase tracking-wide text-pb-gray-text">{col.title}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <Link to={href} className="text-xs text-pb-gray-muted hover:text-pb-green">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-pb-gray-text">Top Categories</p>
          <ul className="mt-3 flex flex-col gap-2">
            {categories.filter((c) => c.id !== 'more').slice(0, 4).map((c) => (
              <li key={c.id}>
                <Link to={`/category/${c.id}`} className="text-xs text-pb-gray-muted hover:text-pb-green">{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-pb-gray-border">
        <div className="mx-auto flex max-w-[1480px] flex-col items-center justify-between gap-3 px-5 py-4 text-[11px] text-pb-gray-muted sm:flex-row">
          <span>© {new Date().getFullYear()} PowerBase Marketplace. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            <Icon name="location" size={12} /> Ghana
          </span>
        </div>
      </div>
    </footer>
  )
}
