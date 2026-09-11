import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import BrandLogo from './BrandLogo.jsx'
import Icon from './Icon.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../services/api.js'

// Main desktop header: utility strip, logo + search + account/cart, then a
// category nav bar underneath. Search is real — it submits to /search and
// the results page reads the query straight from the URL.
export default function Header({ activePath = '' }) {
  const { totalCount } = useCart()
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
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

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = query.trim()
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search')
  }

  return (
    <div className="hidden lg:block">
      <div className="bg-pb-navy text-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-6 py-1.5 text-xs">
          <p>Deliver to Ghana</p>
          <ul className="flex items-center gap-4">
            <li>
              <Link to="/orders/track" className="hover:text-pb-green">
                Track your order
              </Link>
            </li>
            <li className="border-l border-white/20 pl-4">
              <Link to="/support" className="hover:text-pb-green">
                Help
              </Link>
            </li>
            {!isAuthenticated && (
              <li className="border-l border-white/20 pl-4">
                <Link to="/login" className="hover:text-pb-green">
                  Sign in
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>

      <header className="border-b border-pb-gray-border bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center gap-6 px-6 py-3.5">
          <BrandLogo />

          <form role="search" onSubmit={handleSubmit} className="flex flex-1 max-w-2xl items-center">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              className="h-11 w-full rounded-l-sm border border-r-0 border-pb-gray-border bg-white px-4 text-sm text-pb-gray-text placeholder:text-pb-gray-muted focus:outline-none focus:border-pb-green"
            />
            <button
              type="submit"
              aria-label="Search"
              className="flex h-11 w-12 shrink-0 items-center justify-center rounded-r-sm bg-pb-green text-white transition-colors hover:bg-pb-green-dark"
            >
              <Icon name="search" size={19} />
            </button>
          </form>

          <nav className="flex items-center gap-6 text-sm">
            <Link
              to={isAuthenticated ? '/account' : '/login'}
              className="flex flex-col items-center gap-0.5 text-pb-gray-text hover:text-pb-green"
            >
              <Icon name="user" size={21} strokeWidth={1.6} />
              <span className="text-[11px] leading-none">
                {isAuthenticated ? (user?.fullName?.split(' ')[0] || 'Account') : 'Account'}
              </span>
            </Link>
            <Link to="/orders" className="flex flex-col items-center gap-0.5 text-pb-gray-text hover:text-pb-green">
              <Icon name="orders" size={21} strokeWidth={1.6} />
              <span className="text-[11px] leading-none">Orders</span>
            </Link>
            <Link to="/cart" className="relative flex flex-col items-center gap-0.5 text-pb-gray-text hover:text-pb-green">
              <span className="relative">
                <Icon name="cart" size={22} strokeWidth={1.6} />
                {totalCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-pb-green px-1 text-[10px] font-semibold text-white">
                    {totalCount}
                  </span>
                )}
              </span>
              <span className="text-[11px] leading-none">Cart</span>
            </Link>
          </nav>
        </div>

        <div className="border-t border-pb-gray-border">
          <div className="mx-auto flex max-w-[1440px] items-center gap-5 overflow-x-auto px-6 py-2 text-sm text-pb-gray-text">
            <Link
              to="/categories"
              className={`flex shrink-0 items-center gap-1.5 font-semibold ${
                activePath === '/categories' ? 'text-pb-green' : 'hover:text-pb-green'
              }`}
            >
              <Icon name="grid" size={16} />
              All Categories
            </Link>
            {categories.slice(0, 8).map((c) => (
              <Link
                key={c.id}
                to={`/search?category=${encodeURIComponent(c.id)}`}
                className="shrink-0 whitespace-nowrap hover:text-pb-green"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </header>
    </div>
  )
}
