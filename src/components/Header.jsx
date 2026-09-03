import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'
import BrandLogo from './BrandLogo.jsx'
import { categories } from '../data/mockData.js'
import { useCart } from '../context/CartContext.jsx'
import { useAccount } from '../context/AccountContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const NAV_LINKS = [
  ['Home', '/'],
  ['Shop', '/shop'],
  ['Flash Deals', '/flash-deals'],
  ['New Arrivals', '/shop'],
  ['Best Sellers', '/shop'],
  ['Brands', '/shop'],
  ['Track Order', '/orders/track'],
  ['Help Center', '/support'],
]

export default function Header({ activePath = '/' }) {
  const [query, setQuery] = useState('')
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const { totalCount: cartCount, subtotal: cartSubtotal } = useCart()
  const { unreadNotificationCount } = useAccount()
  const { user } = useAuth()

  useEffect(() => {
    const handler = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setCategoriesOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function submitSearch(event) {
    event.preventDefault()
    const value = query.trim()
    if (value) navigate(`/shop?search=${encodeURIComponent(value)}`)
  }

  return (
    <header className="hidden bg-white lg:block">
      <div className="bg-pb-green-dark text-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-2 text-[10px] font-semibold xl:px-6">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5"><Icon name="headphones" size={12} />24/7 Customer Support</span>
            <span className="flex items-center gap-1.5"><Icon name="truck" size={12} />Fast &amp; Reliable Delivery</span>
            <span className="hidden items-center gap-1.5 md:flex"><Icon name="tag" size={12} />Free delivery on orders above GH₵300</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/vendor/apply" className="hover:text-pb-green-light">Sell on PowerBase</Link>
            <Link to="/orders/track" className="hover:text-pb-green-light">Track Order</Link>
            <span className="flex items-center gap-1"><Icon name="location" size={12} />Ghana<Icon name="chevronDown" size={10} /></span>
          </div>
        </div>
      </div>

      <div className="border-b border-pb-gray-border bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center gap-5 px-4 py-4 xl:px-6">
          <BrandLogo />
          <div ref={dropdownRef} className="relative shrink-0">
            <button type="button" onClick={() => setCategoriesOpen((open) => !open)} className="flex h-11 items-center gap-2 rounded-lg bg-pb-green px-4 text-xs font-extrabold text-white transition hover:bg-pb-green-dark">
              <Icon name="grid" size={15} />All Categories<Icon name="chevronDown" size={13} />
            </button>
            {categoriesOpen && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-lg border border-pb-gray-border bg-white py-1 shadow-panel">
                {categories.filter((category) => category.id !== 'more').map((category) => (
                  <Link key={category.id} to={`/category/${category.id}`} onClick={() => setCategoriesOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-pb-gray-text hover:bg-pb-green-light">
                    <Icon name={category.icon} size={14} className="text-pb-gray-muted" />{category.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={submitSearch} className="flex h-11 min-w-0 flex-1 overflow-hidden rounded-lg border border-pb-gray-border bg-white focus-within:border-pb-green focus-within:ring-2 focus-within:ring-pb-green/10">
            <div className="flex min-w-0 flex-1 items-center px-3">
              <Icon name="search" size={17} className="shrink-0 text-pb-gray-muted" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search for products, brands and more" className="w-full bg-transparent px-3 text-xs outline-none placeholder:text-pb-gray-muted" />
            </div>
            <div className="hidden items-center border-l border-pb-gray-border px-3 text-[10px] font-semibold text-pb-gray-muted xl:flex">All Categories<Icon name="chevronDown" size={11} className="ml-2" /></div>
            <button type="submit" aria-label="Search" className="flex w-12 shrink-0 items-center justify-center bg-pb-green text-white transition hover:bg-pb-green-dark"><Icon name="search" size={17} /></button>
          </form>

          <div className="flex shrink-0 items-center gap-5">
            <Link to="/account/notifications" className="header-action">
              <span className="relative"><Icon name="bell" size={20} />{unreadNotificationCount > 0 && <span className="header-badge -right-2 -top-2">{unreadNotificationCount}</span>}</span>
              <span>Alerts</span>
            </Link>
            <Link to="/wishlist" className="header-action"><Icon name="heart" size={20} /><span>Wishlist</span></Link>
            <Link to="/account" className="header-action"><Icon name="user" size={20} /><span>{user ? 'Account' : 'Sign in'}</span></Link>
            <Link to="/cart" className="flex items-center gap-2 border-l border-pb-gray-border pl-4">
              <span className="relative"><Icon name="cart" size={23} className="text-pb-green" />{cartCount > 0 && <span className="header-badge -right-2 -top-2">{cartCount}</span>}</span>
              <span className="text-[10px] font-bold leading-tight text-pb-gray-text">Cart<br /><strong className="text-xs">GH₵{cartSubtotal.toFixed(2)}</strong></span>
            </Link>
          </div>
        </div>
      </div>

      <div className="border-b border-pb-gray-border bg-white">
        <nav className="mx-auto flex max-w-[1440px] items-center gap-8 px-4 py-3 xl:px-6" aria-label="Primary">
          {NAV_LINKS.map(([label, href]) => {
            const active = href === activePath
            return <Link key={label} to={href} className={`relative py-1 text-[11px] font-bold ${active ? 'text-pb-green' : 'text-pb-gray-text hover:text-pb-green'}`}>{label}{active && <span className="absolute -bottom-[13px] left-0 right-0 h-0.5 bg-pb-green" />}</Link>
          })}
        </nav>
      </div>
    </header>
  )
}
