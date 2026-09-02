import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { currentUser, formatGHS } from '../data/mockData.js'
import { useCart } from '../context/CartContext.jsx'
import { useAccount } from '../context/AccountContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Flash Deals', href: '/flash-deals', hot: true },
  { label: 'New Arrivals', href: '/shop' },
  { label: 'Best Sellers', href: '/shop' },
  { label: 'Categories', href: '/categories' },
  { label: 'Track Order', href: '/orders/track' },
  { label: 'Help Center', href: '/support' },
]

export default function Header({ activePath = '/' }) {
  const [query, setQuery] = useState('')
  const { totalCount: cartCount, subtotal: cartSubtotal } = useCart()
  const { profile, unreadNotificationCount } = useAccount()
  const { isAuthenticated, user, logout } = useAuth()
  const displayName = user?.fullName || profile.fullName || currentUser.name

  return (
    <header className="hidden border-b border-pb-gray-border bg-white xl:block">
      <div className="border-b border-pb-gray-border bg-pb-gray-bg">
        <div className="mx-auto flex h-9 max-w-[1480px] items-center justify-between px-5 text-[12px] text-pb-gray-muted">
          <span className="flex items-center gap-1.5 font-medium text-pb-gray-text">
            <Icon name="shield" size={13} className="text-pb-green" /> 100% Secure Payments
          </span>
          <span>Free delivery on orders above GH₵300</span>
          <span className="flex items-center gap-4">
            <Link to="/vendors/sell" className="hover:text-pb-green">Sell on PowerBase</Link>
            <span className="text-pb-gray-border">|</span>
            <Link to="/support" className="hover:text-pb-green">Customer Support</Link>
            <span className="text-pb-gray-border">|</span>
            <Link to="/orders/track" className="hover:text-pb-green">Track Order</Link>
          </span>
        </div>
      </div>
      <div className="mx-auto max-w-[1480px] px-5">
        <div className="flex h-[78px] items-center gap-7">
          <Link to="/" className="flex w-[220px] shrink-0 items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pb-green text-lg font-bold text-white shadow-sm">P</span>
            <span className="leading-tight">
              <span className="block text-[22px] font-extrabold tracking-tight text-pb-gray-text">Power<span className="text-pb-green">Base</span></span>
              <span className="block text-[11px] font-medium text-pb-gray-muted">Marketplace</span>
            </span>
          </Link>

          <form
            role="search"
            onSubmit={(e) => e.preventDefault()}
            className="flex h-11 min-w-0 flex-1 items-stretch overflow-hidden rounded-xl border border-pb-gray-border bg-white focus-within:border-pb-green focus-within:ring-2 focus-within:ring-pb-green/10"
          >
            <button type="button" className="flex w-32 shrink-0 items-center justify-between border-r border-pb-gray-border px-4 text-sm font-medium text-pb-gray-text">
              All Categories <Icon name="chevronDown" size={14} className="text-pb-gray-muted" />
            </button>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products, brands and categories..."
              className="min-w-0 flex-1 bg-transparent px-4 text-sm text-pb-gray-text placeholder:text-pb-gray-muted focus:outline-none"
            />
            <button type="submit" aria-label="Search" className="flex w-12 items-center justify-center bg-pb-green text-white transition hover:bg-pb-green-dark">
              <Icon name="search" size={19} />
            </button>
          </form>

          <div className="flex shrink-0 items-center gap-6">
            <Link to="/wishlist" className="group flex items-center gap-2 text-pb-gray-text">
              <span className="relative"><Icon name="heart" size={24} className="group-hover:text-pb-green" /><span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-pb-green px-1 text-[9px] font-bold text-white">0</span></span>
              <span className="text-xs font-medium">Wishlist</span>
            </Link>
            <Link to="/account" className="flex items-center gap-2 text-pb-gray-text">
              <Icon name="user" size={25} />
              <span className="leading-tight">
                <span className="block text-[10px] text-pb-gray-muted">{isAuthenticated ? `Hello, ${displayName.split(' ')[0]}` : 'Hello, Sign in'}</span>
                <span className="flex items-center gap-1 text-xs font-semibold">Account <Icon name="chevronDown" size={11} /></span>
              </span>
            </Link>
            <Link to="/cart" className="group flex items-center gap-2 border-l border-pb-gray-border pl-5 text-pb-gray-text">
              <span className="relative"><Icon name="cart" size={25} className="group-hover:text-pb-green" /><span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-pb-green px-1 text-[9px] font-bold text-white">{cartCount}</span></span>
              <span className="leading-tight">
                <span className="block text-xs font-medium">My Cart</span>
                <span className="block text-xs font-bold">{formatGHS(cartSubtotal)}</span>
              </span>
              <Icon name="chevronDown" size={13} className="text-pb-gray-muted" />
            </Link>
          </div>
        </div>

        <div className="flex h-12 items-center">
          <Link to="/categories" className="flex h-10 w-[220px] shrink-0 items-center gap-3 rounded-t-xl bg-pb-green px-5 text-sm font-bold text-white hover:bg-pb-green-dark">
            <Icon name="menu" size={19} /> All Categories <Icon name="chevronDown" size={14} className="ml-auto" />
          </Link>
          <nav className="flex flex-1 items-center justify-center gap-8" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link key={link.label} to={link.href}
                className={`relative flex items-center gap-1 py-3 text-sm font-medium transition ${
                  link.href === activePath
                    ? 'font-semibold text-pb-green'
                    : link.hot
                      ? 'font-semibold text-pb-red hover:text-pb-red/80'
                      : 'text-pb-gray-text hover:text-pb-green'
                }`}>
                {link.label}
                {link.href === activePath && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-pb-green" />}
              </Link>
            ))}
          </nav>
          {unreadNotificationCount > 0 && (
            <Link to="/account/notifications" className="hidden text-xs text-pb-green lg:block">Notifications ({unreadNotificationCount})</Link>
          )}
          {isAuthenticated && <button onClick={logout} className="ml-4 hidden text-xs text-pb-gray-muted hover:text-pb-red 2xl:block">Log out</button>}
        </div>
      </div>
    </header>
  )
}
