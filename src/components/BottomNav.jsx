import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { useCart } from '../context/CartContext.jsx'

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: 'home', href: '/' },
  { id: 'categories', label: 'Categories', icon: 'grid', href: '/categories' },
  { id: 'cart', label: 'Cart', icon: 'cart', href: '/cart' },
  { id: 'orders', label: 'Orders', icon: 'orders', href: '/orders' },
  { id: 'account', label: 'Account', icon: 'user', href: '/account' },
]

export default function BottomNav({ activeId = 'home' }) {
  const { totalCount: cartCount } = useCart()

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-pb-gray-border bg-white py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === activeId
        return (
          <Link
            key={item.id}
            to={item.href}
            className={`relative flex flex-col items-center gap-0.5 px-2 py-1 text-[11px] ${
              isActive ? 'text-pb-green' : 'text-pb-gray-muted'
            }`}
          >
            <span className="relative">
              <Icon name={item.icon} size={21} strokeWidth={isActive ? 2.1 : 1.8} />
              {item.id === 'cart' && cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-pb-red px-1 text-[10px] font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
