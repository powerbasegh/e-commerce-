import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { categories } from '../data/mockData.js'
import { useCart } from '../context/CartContext.jsx'
import { useAccount } from '../context/AccountContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function MobileHeader({ onOpenMenu }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { totalCount: cartCount } = useCart()
  // Real unread notification count — see the same note in Header.jsx.
  const { unreadNotificationCount } = useAccount()
  const { isAuthenticated, user, logout } = useAuth()

  function toggleMenu() {
    setMenuOpen((v) => !v)
    onOpenMenu?.()
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-pb-gray-border bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={toggleMenu}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-pb-gray-text active:bg-pb-gray-bg"
        >
          <Icon name="menu" size={22} />
        </button>

        <a href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pb-green text-sm font-bold text-white">
            P
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold text-pb-gray-text">PowerBase</span>
            <span className="block text-[10px] text-pb-gray-muted">Everything you need</span>
          </span>
        </a>

        <div className="flex items-center gap-1">
          <Link to="/account/notifications" aria-label="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-lg text-pb-gray-text active:bg-pb-gray-bg">
            <Icon name="bell" size={21} />
            {unreadNotificationCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-pb-red px-1 text-[10px] font-semibold text-white">
                {unreadNotificationCount}
              </span>
            )}
          </Link>
          <Link to="/cart" aria-label="Cart" className="relative flex h-9 w-9 items-center justify-center rounded-lg text-pb-gray-text active:bg-pb-gray-bg">
            <Icon name="cart" size={21} />
            {cartCount > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-pb-red px-1 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white p-4 shadow-panel">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold text-pb-gray-text">All Categories</span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-pb-gray-muted active:bg-pb-gray-bg"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <ul className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
              {categories.map((category) => (
                <li key={category.id}>
                  <a
                    href={`/category/${category.id}`}
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-pb-gray-text active:bg-pb-green-light"
                  >
                    <Icon name={category.icon} size={16} className="text-pb-gray-muted" />
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
            <a
              href="/vendor/apply"
              className="mt-3 flex items-center justify-center gap-2 rounded-card bg-pb-green py-2.5 text-sm font-semibold text-white"
            >
              Become a Vendor
            </a>

            {isAuthenticated ? (
              <div className="mt-3 flex items-center justify-between rounded-card border border-pb-gray-border px-3 py-2.5">
                <span className="truncate text-sm text-pb-gray-text">{user?.fullName}</span>
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    setMenuOpen(false)
                  }}
                  className="shrink-0 text-xs font-semibold text-pb-red"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="mt-3 flex items-center justify-center gap-2 rounded-card border border-pb-green py-2.5 text-sm font-semibold text-pb-green"
              >
                Log In
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
