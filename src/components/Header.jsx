import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { categories, currentUser } from '../data/mockData.js'
import { useCart } from '../context/CartContext.jsx'
import { useAccount } from '../context/AccountContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/shop' },
  { label: 'Flash Deals', href: '/flash-deals' },
  { label: 'New Arrivals', href: '/shop' },
  { label: 'Best Sellers', href: '/shop' },
  { label: 'Brands', href: '/shop' },
  { label: 'Track Order', href: '/orders/track' },
  { label: 'Help Center', href: '/support' },
]

export default function Header({ activePath = '/' }) {
  const [query, setQuery] = useState('')
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const dropdownRef = useRef(null)

  const { totalCount: cartCount } = useCart()
  const { profile, unreadNotificationCount } = useAccount()
  const { isAuthenticated, user, logout } = useAuth()
  const displayName = user?.fullName || profile.fullName || currentUser.name

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setCategoriesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="hidden border-b border-pb-gray-border bg-white lg:block">
      {/* Main row: logo, all-categories, search, wishlist/account/cart */}
      <div className="mx-auto flex max-w-[1480px] items-center gap-4 px-5 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-pb-green text-lg font-bold text-white">
            P
          </span>
          <span className="leading-tight">
            <span className="block text-[17px] font-extrabold text-pb-gray-text">PowerBase</span>
            <span className="block text-[10px] text-pb-gray-muted">Everything you need</span>
          </span>
        </Link>

        <div ref={dropdownRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setCategoriesOpen((v) => !v)}
            aria-expanded={categoriesOpen}
            className="flex items-center gap-2 rounded-lg bg-pb-green px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-pb-green-dark"
          >
            <Icon name="grid" size={16} />
            All Categories
            <Icon name="chevronDown" size={13} />
          </button>

          {categoriesOpen && (
            <div className="absolute left-0 top-[calc(100%+8px)] z-40 w-64 overflow-hidden rounded-lg border border-pb-gray-border bg-white py-1.5 shadow-panel">
              {categories
                .filter((c) => c.id !== 'more')
                .map((category) => (
                  <Link
                    key={category.id}
                    to={`/category/${category.id}`}
                    onClick={() => setCategoriesOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-[13px] text-pb-gray-text transition-colors hover:bg-pb-green-light hover:text-pb-green-dark"
                  >
                    <Icon name={category.icon} size={15} className="shrink-0 text-pb-gray-muted" />
                    {category.name}
                  </Link>
                ))}
            </div>
          )}
        </div>

        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          className="flex min-w-0 flex-1 items-center rounded-lg border border-pb-gray-border bg-white pl-4 focus-within:border-pb-green"
        >
          <Icon name="search" size={17} className="shrink-0 text-pb-gray-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products, brands and more"
            className="w-full min-w-0 bg-transparent px-3 py-2.5 text-[13px] text-pb-gray-text placeholder:text-pb-gray-muted focus:outline-none"
          />
          <span className="hidden shrink-0 items-center gap-1 border-x border-pb-gray-border px-3 py-2 text-[11px] text-pb-gray-muted md:flex">
            All Categories
            <Icon name="chevronDown" size={12} />
          </span>
          <button
            type="submit"
            aria-label="Search"
            className="flex shrink-0 items-center justify-center rounded-r-lg bg-pb-green px-4 py-[11px] text-white transition-colors hover:bg-pb-green-dark"
          >
            <Icon name="search" size={17} />
          </button>
        </form>

        <div className="flex shrink-0 items-center gap-4">
          <Link
            to="/account/notifications"
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-pb-gray-text hover:bg-pb-gray-bg hover:text-pb-green"
          >
            <Icon name="bell" size={18} />
            {unreadNotificationCount > 0 && (
              <span className="absolute right-0 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-pb-red px-1 text-[10px] font-semibold text-white">
                {unreadNotificationCount}
              </span>
            )}
          </Link>

          <a href="/wishlist" className="flex flex-col items-center gap-0.5 text-pb-gray-text hover:text-pb-green">
            <Icon name="heart" size={20} />
            <span className="text-[11px]">Wishlist</span>
          </a>

          <Link to="/account" className="flex flex-col items-center gap-0.5 text-pb-gray-text hover:text-pb-green">
            <Icon name="user" size={20} />
            <span className="text-[11px]">Account</span>
          </Link>

          <Link to="/cart" className="relative flex flex-col items-center gap-0.5 text-pb-gray-text hover:text-pb-green">
            <Icon name="cart" size={20} />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-pb-red px-1 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            )}
            <span className="text-[11px]">Cart</span>
          </Link>
        </div>
      </div>

      {/* Nav row */}
      <div className="border-t border-pb-gray-border">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between px-6 py-2.5">
          <nav className="flex items-center gap-5" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  link.href === activePath ? 'text-pb-green' : 'text-pb-gray-text hover:text-pb-green'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3 border-l border-pb-gray-border pl-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pb-green-light text-xs font-semibold text-pb-green-dark">
              {displayName
                .split(' ')
                .filter(Boolean)
                .map((n) => n[0])
                .join('')}
            </span>
            <span className="text-xs font-medium text-pb-gray-text">{displayName}</span>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={logout}
                className="text-xs font-medium text-pb-gray-muted hover:text-pb-red"
              >
                Log Out
              </button>
            ) : (
              <Link to="/login" className="text-xs font-semibold text-pb-green hover:underline">
                Log In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
