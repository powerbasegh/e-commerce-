import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { api } from '../services/api.js'

const COLUMNS = [
  {
    title: 'Shop',
    links: [
      ['Deals', '/search?sort=price_asc'],
      ['New Arrivals', '/search?sort=newest'],
      ['All Categories', '/categories'],
    ],
  },
  {
    title: 'Customer Care',
    links: [
      ['Help Center', '/support'],
      ['Track an Order', '/orders/track'],
      ['My Orders', '/orders'],
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

export default function Footer() {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    let cancelled = false
    api
      .getCategories()
      .then((data) => {
        if (!cancelled) setCategories(data.categories || [])
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <footer className="mt-6 border-t border-pb-gray-border bg-white">
      <div className="mx-auto grid max-w-[1480px] grid-cols-2 gap-8 px-5 py-10 md:grid-cols-5">
        <div className="col-span-2">
          <span className="flex items-center gap-2.5">
            <img src="/logo-powerbase.png" alt="" aria-hidden="true" className="h-9 w-9 object-contain" />
            <span className="text-lg font-extrabold tracking-tight text-pb-navy">
              Power<span className="text-pb-green">Base</span>
            </span>
          </span>
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-pb-gray-muted">
            PowerBase is an online store in Ghana for electronics, fashion, home and more —
            secure payments and delivery to your door on every order.
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
                  <Link to={href} className="text-xs text-pb-gray-muted hover:text-pb-green">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-pb-gray-text">Top Categories</p>
          <ul className="mt-3 flex flex-col gap-2">
            {categories.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link to={`/search?category=${encodeURIComponent(c.id)}`} className="text-xs text-pb-gray-muted hover:text-pb-green">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-pb-gray-border">
        <div className="mx-auto flex max-w-[1480px] flex-col items-center justify-between gap-3 px-5 py-4 text-[11px] text-pb-gray-muted sm:flex-row">
          <span>© {new Date().getFullYear()} PowerBase. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            <Icon name="location" size={12} /> Ghana
          </span>
        </div>
      </div>
    </footer>
  )
}
