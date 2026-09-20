import { NavLink } from 'react-router-dom'
import Icon from '../Icon.jsx'
import { ADMIN_NAV_ITEMS } from './adminNavItems.js'

export default function AdminNav({ onNavigate }) {
  return (
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
      {ADMIN_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.id}
          to={item.href}
          end={item.href === '/admin'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                  isActive ? 'bg-pb-green text-white' : 'bg-white/5 text-white/60'
                }`}
              >
                <Icon name={item.icon} size={15} strokeWidth={isActive ? 2.1 : 1.8} />
              </span>
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
