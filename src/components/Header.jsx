import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { currentUser } from '../data/mockData.js'
import { useCart } from '../context/CartContext.jsx'
import { useAccount } from '../context/AccountContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Categories', href: '/categories' },
  { label: 'Flash Deals', href: '/flash-deals' },
  { label: 'Top Vendors', href: '/vendors' },
  { label: 'Track Order', href: '/orders/track' },
  { label: 'Support', href: '/support' },
]

export default function Header({ activePath = '/' }) {
  const [query, setQuery] = useState('')
  const { totalCount: cartCount } = useCart()
  // Real unread notification count from AccountContext — the old
  // hardcoded `notificationCount` prop pages used to pass in is no longer
  // read, since a real (if still frontend-only) notification center now
  // exists at /account/notifications.
  const { profile, unreadNotificationCount } = useAccount()
  const { isAuthenticated, user, logout } = useAuth()
  const displayName = user?.fullName || profile.fullName || currentUser.name

  return (
    <header className="hidden border-b border-pb-gray-border bg-white lg:block">
      <div className="mx-auto flex max-w-[1400px] items-center gap-8 px-6 py-3">
        <a href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-pb-green text-base font-bold text-white">
            P
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold text-pb-gray-text">PowerBase</span>
            <span className="block text-[11px] text-pb-gray-muted">Marketplace</span>
          </span>
        </a>

        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          className="flex min-w-0 flex-1 items-center rounded-full border border-pb-gray-border bg-pb-gray-bg pl-4 pr-1.5 py-1.5 focus-within:border-pb-green"
        >
          <Icon name="search" size={17} className="shrink-0 text-pb-gray-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products, brands and more..."
            className="w-full min-w-0 bg-transparent px-3 text-sm text-pb-gray-text placeholder:text-pb-gray-muted focus:outline-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-pb-green px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-pb-green-dark"
          >
            Search
          </button>
        </form>

        <nav className="flex shrink-0 items-center gap-6" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                link.href === activePath
                  ? 'text-pb-green'
                  : 'text-pb-gray-text hover:text-pb-green'
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-5">
          <a href="/wishlist" className="flex flex-col items-center gap-0.5 text-pb-gray-text hover:text-pb-green">
            <Icon name="heart" size={19} />
            <span className="text-[11px]">Wishlist</span>
          </a>

          <Link to="/account/notifications" className="relative flex flex-col items-center gap-0.5 text-pb-gray-text hover:text-pb-green">
            <Icon name="bell" size={19} />
            {unreadNotificationCount > 0 && (
              <span className="absolute -right-1.5 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-pb-red px-1 text-[10px] font-semibold text-white">
                {unreadNotificationCount}
              </span>
            )}
            <span className="text-[11px]">Notifications</span>
          </Link>

          <Link to="/cart" className="relative flex flex-col items-center gap-0.5 text-pb-gray-text hover:text-pb-green">
            <Icon name="cart" size={19} />
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-pb-red px-1 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            )}
            <span className="text-[11px]">Cart</span>
          </Link>

          <Link to="/account" className="flex items-center gap-2 border-l border-pb-gray-border pl-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pb-green-light text-sm font-semibold text-pb-green-dark">
              {displayName
                .split(' ')
                .filter(Boolean)
                .map((n) => n[0])
                .join('')}
            </span>
            <span className="leading-tight">
              <span className="block text-sm font-medium text-pb-gray-text">{displayName}</span>
              <span className="flex items-center gap-0.5 text-[11px] text-pb-gray-muted">
                My Account
                <Icon name="chevronDown" size={12} />
              </span>
            </span>
          </Link>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={logout}
              className="shrink-0 text-xs font-medium text-pb-gray-muted hover:text-pb-red"
            >
              Log Out
            </button>
          ) : (
            <Link to="/login" className="shrink-0 text-xs font-semibold text-pb-green hover:underline">
              Log In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
