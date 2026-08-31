import Icon from './Icon.jsx'
import { categories } from '../data/mockData.js'

export default function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col lg:flex" aria-label="Category navigation">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pb-green text-sm font-bold text-white">
          P
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold text-pb-gray-text">PowerBase</p>
          <p className="text-[11px] text-pb-gray-muted">Marketplace</p>
        </div>
      </div>

      <a
        href="/categories"
        className="mb-2 flex items-center justify-center gap-2 rounded-card bg-pb-green py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-pb-green-dark"
      >
        <Icon name="grid" size={16} />
        All Categories
      </a>

      <nav className="flex flex-col rounded-card border border-pb-gray-border bg-white py-1 shadow-card">
        {categories
          .filter((c) => c.id !== 'more')
          .map((category) => (
            <a
              key={category.id}
              href={`/category/${category.id}`}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-pb-gray-text transition-colors hover:bg-pb-green-light hover:text-pb-green-dark"
            >
              <Icon name={category.icon} size={16} className="shrink-0 text-pb-gray-muted" />
              <span className="line-clamp-1">{category.name}</span>
            </a>
          ))}
        <a
          href="/categories"
          className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-pb-green transition-colors hover:bg-pb-green-light"
        >
          <Icon name="more" size={16} className="shrink-0" />
          More Categories
        </a>
      </nav>

      <a
        href="/vendor/apply"
        className="mt-auto flex items-center gap-3 rounded-card border border-pb-gray-border bg-white p-3 shadow-card transition-shadow hover:shadow-panel"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pb-green-light text-pb-green">
          <Icon name="vendors" size={18} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-pb-gray-text">Become a Vendor</span>
          <span className="block truncate text-xs text-pb-gray-muted">Start selling on PowerBase</span>
        </span>
        <Icon name="chevronRight" size={16} className="ml-auto shrink-0 text-pb-gray-muted" />
      </a>
    </aside>
  )
}
