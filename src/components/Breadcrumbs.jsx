import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'

export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-pb-gray-muted sm:text-sm">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={item.href ?? item.label} className="flex items-center gap-1.5">
            {i > 0 && <Icon name="chevronRight" size={12} className="shrink-0" />}
            {isLast || !item.href ? (
              <span className={isLast ? 'line-clamp-1 font-medium text-pb-gray-text' : ''}>{item.label}</span>
            ) : (
              <Link to={item.href} className="hover:text-pb-green">
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
