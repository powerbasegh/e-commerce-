import { Link } from 'react-router-dom'
import Icon from '../Icon.jsx'
import { ACCOUNT_NAV_ITEMS } from './AccountNav.jsx'

export default function AccountMobileMenuList() {
  const items = ACCOUNT_NAV_ITEMS.filter((item) => item.id !== 'dashboard')

  return (
    <div className="flex flex-col gap-1 rounded-card border border-pb-gray-border bg-white p-2 shadow-card">
      {items.map((item) => (
        <Link
          key={item.id}
          to={item.href}
          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-pb-gray-text active:bg-pb-gray-bg"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pb-green-light text-pb-green">
            <Icon name={item.icon} size={17} />
          </span>
          <span className="flex-1">{item.label}</span>
          <Icon name="chevronRight" size={16} className="text-pb-gray-muted" />
        </Link>
      ))}
    </div>
  )
}
