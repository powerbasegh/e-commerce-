import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { categories, currentUser, formatGHS } from '../data/mockData.js'
import { useCart } from '../context/CartContext.jsx'
import { useAccount } from '../context/AccountContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Flash Deals', href: '/flash-deals', hot: true },
  { label: 'New Arrivals', href: '/shop' },
  { label: 'Best Sellers', href: '/shop' },
  { label: 'Brands', href: '/vendors' },
  { label: 'Track Order', href: '/orders/track' },
  { label: 'Help Center', href: '/support' },
]

// Top utility strip — store-wide reassurance + secondary links, per the
// customer-frontend spec. Kept as its own component so it can be reused
// or hidden independently of the main header.
function UtilityBar() {
  return (
    <div className="border-b border-pb-gray-border bg-pb-gray-bg">
      <div className="mx-auto flex h-9 max-w-[1480px] items-center justify-between px-5 text-[12px] text-pb-gray-muted">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5">
            <Icon name="headphones" size={13} className="text-pb-green" /> 24/7 Customer Support
          </span>
          <span className="flex items-center gap-1.5">
            <Icon name="truck" size={13} className="text-pb-green" /> Fast &amp; Reliable Delivery
          </span>
          <span className="hidden font-medium text-pb-gray-text lg:inline">
            Free delivery on orders above GH₵300
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/vendors/sell" className="hover:text-pb-green">Sell on PowerBase</Link>
          <span className="text-pb-gray-border">|</span>
          <Link to="/orders/track" className="hover:text-pb-green">Track Order</Link>
          <span className="text-pb-gray-border">|</span>
          <span className="flex items-center gap-1.5 text-pb-gray-text">
            <Icon name="location" size={13} /> Ghana
          </span>
        </div>
      </div>
    </div>
  )
}

// Primary desktop nav row with the "All Categories" mega-menu trigger and
// the standing nav links. Isolated from Header so the active-link logic
// stays easy to reason about on its own.
function MainNavigation({ activePath }) {
  const [categoriesOpen, setCategoriesOpen] = useState(false)

  return (
    <div className="flex h-12 items-center">
      <div
        className="relative"
        onMouseEnter={() => setCategoriesOpen(true)}
        onMouseLeave={() => setCategoriesOpen(false)}
      >
        <Link
          to="/categories"
          className="flex h-10 w-[220px] shrink-0 items-center gap-3 rounded-t-xl bg-pb-green px-5 text-sm font-bold text-white transition hover:bg-pb-green-dark"
        >
          <Icon name="menu" size={19} /> All Categories
          <Icon name="chevronDown" size={14} className="ml-auto" />
        </Link>
        {categoriesOpen && (
          <div className="absolute left-0 top-10 z-30 w-[280px] overflow-hidden rounded-b-xl border border-t-0 border-pb-gray-border bg-white shadow-panel">
            {categories.filter((c) => c.id !== 'more').map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.id}`}
                className="group flex items-center gap-3 px-4 py-2.5 text-[13px] text-pb-gray-text transition hover:bg-pb-green-light hover:font-semibold hover:text-pb-green-dark"
              >
                <Icon name={category.icon} size={16} className="shrink-0 text-pb-gray-muted group-hover:text-pb-green" />
                <span className="min-w-0 flex-1 truncate">{category.name}</span>
                <Icon name="chevronRight" size={13} className="text-pb-gray-border group-hover:text-pb-green" />
              </Link>
            ))}
          </div>
        )}
      </div>

      <nav className="flex flex-1 items-center justify-center gap-8" aria-label="Primary">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            to={link.href}
            className={`relative flex items-center gap-1 py-3 text-sm font-medium transition ${
              link.href === activePath
                ? 'font-semibold text-pb-green'
                : link.hot
                  ? 'font-semibold text-pb-red hover:text-pb-red/80'
                  : 'text-pb-gray-text hover:text-pb-green'
            }`}
          >
            {link.label}
            {link.href === activePath && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-pb-green" />
            )}
          </Link>
        ))}
      </nav>
    </div>
  )
}

export default function Header({ activePath = '/' }) {
  const [query, setQuery] = useState('')
  const { totalCount: cartCount, subtotal: cartSubtotal } = useCart()
  const { profile, unreadNotificationCount } = useAccount()
  const { isAuthenticated, user, logout } = useAuth()
  const displayName = user?.fullName || profile.fullName || currentUser.name

  return (
    <header className="hidden border-b border-pb-gray-border bg-white xl:block">
      <UtilityBar />

      <div className="mx-auto max-w-[1480px] px-5">
        <div className="flex h-[78px] items-center gap-7">
          <Link to="/" className="flex w-[220px] shrink-0 items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pb-green text-lg font-bold text-white">P</span>
            <span className="leading-tight">
              <span className="block text-[22px] font-extrabold tracking-tight text-pb-gray-text">
                Power<span className="text-pb-green">Base</span>
              </span>
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
              <span className="relative">
                <Icon name="heart" size={24} className="group-hover:text-pb-green" />
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-pb-green px-1 text-[9px] font-bold text-white">0</span>
              </span>
              <span className="text-xs font-medium">Wishlist</span>
            </Link>
            <Link to="/account" className="flex items-center gap-2 text-pb-gray-text">
              <Icon name="user" size={25} />
              <span className="leading-tight">
                <span className="block text-[10px] text-pb-gray-muted">
                  {isAuthenticated ? `Hello, ${displayName.split(' ')[0]}` : 'Hello, Sign in'}
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold">Account <Icon name="chevronDown" size={11} /></span>
              </span>
            </Link>
            <Link to="/cart" className="group flex items-center gap-2 border-l border-pb-gray-border pl-5 text-pb-gray-text">
              <span className="relative">
                <Icon name="cart" size={25} className="group-hover:text-pb-green" />
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-pb-green px-1 text-[9px] font-bold text-white">{cartCount}</span>
              </span>
              <span className="leading-tight">
                <span className="block text-xs font-medium">My Cart</span>
                <span className="block text-xs font-bold">{formatGHS(cartSubtotal)}</span>
              </span>
            </Link>
          </div>
        </div>

        <MainNavigation activePath={activePath} />

        {(unreadNotificationCount > 0 || isAuthenticated) && (
          <div className="flex h-8 items-center justify-end gap-4 border-t border-pb-gray-border text-xs">
            {unreadNotificationCount > 0 && (
              <Link to="/account/notifications" className="text-pb-green">Notifications ({unreadNotificationCount})</Link>
            )}
            {isAuthenticated && (
              <button onClick={logout} className="text-pb-gray-muted hover:text-pb-red">Log out</button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
