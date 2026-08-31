import { Link } from 'react-router-dom'
import Icon from '../Icon.jsx'

const ACTIONS = [
  { label: 'View My Orders', href: '/orders', icon: 'orders' },
  { label: 'Track an Order', href: '/orders/track', icon: 'location' },
  { label: 'Edit Profile', href: '/account/profile', icon: 'edit' },
  { label: 'Manage Addresses', href: '/account/addresses', icon: 'location' },
]

export default function AccountQuickActions() {
  return (
    <div className="rounded-card border border-pb-gray-border bg-white p-4 shadow-card sm:p-5">
      <h2 className="mb-3 text-sm font-bold text-pb-gray-text sm:text-base">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            to={action.href}
            className="flex flex-col items-start gap-2 rounded-lg border border-pb-gray-border p-3 text-sm font-medium text-pb-gray-text transition-colors hover:border-pb-green hover:bg-pb-green-light"
          >
            <Icon name={action.icon} size={18} className="text-pb-green" />
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
