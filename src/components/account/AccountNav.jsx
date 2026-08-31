import { Link } from 'react-router-dom'
import Icon from '../Icon.jsx'

export const ACCOUNT_NAV_ITEMS = [
  { id: 'dashboard', label: 'Account Overview', href: '/account', icon: 'user' },
  { id: 'profile', label: 'Profile', href: '/account/profile', icon: 'edit' },
  { id: 'orders', label: 'My Orders', href: '/account/orders', icon: 'orders' },
  { id: 'addresses', label: 'Saved Addresses', href: '/account/addresses', icon: 'location' },
  { id: 'notifications', label: 'Notifications', href: '/account/notifications', icon: 'bell' },
  { id: 'settings', label: 'Settings', href: '/account/settings', icon: 'settings' },
]

export default function AccountNav({ activeId }) {
  return (
    <nav
      aria-label="My Account"
      className="flex w-60 shrink-0 flex-col gap-1 rounded-card border border-pb-gray-border bg-white p-3 shadow-card"
    >
      <p className="px-2 pb-2 pt-1 text-xs font-bold uppercase tracking-wide text-pb-gray-muted">
        My Account
      </p>
      {ACCOUNT_NAV_ITEMS.map((item) => {
        const isActive = item.id === activeId
        return (
          <Link
            key={item.id}
            to={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-pb-green-light text-pb-green-dark'
                : 'text-pb-gray-text hover:bg-pb-gray-bg'
            }`}
          >
            <Icon name={item.icon} size={17} strokeWidth={isActive ? 2.1 : 1.8} />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
