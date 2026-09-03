import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { categories } from '../data/mockData.js'

export default function CategorySidebar() {
  return (
    <aside className="hidden w-[218px] shrink-0 lg:block" aria-label="Category navigation">
      <nav className="overflow-hidden rounded-2xl border border-pb-gray-border bg-white shadow-card">
        <div className="flex items-center justify-between bg-pb-green px-4 py-3.5 text-white">
          <span className="flex items-center gap-2 text-sm font-extrabold"><Icon name="grid" size={16} /> All Categories</span>
          <Icon name="chevronDown" size={14} />
        </div>
        <div className="py-1.5">
          {categories.filter((c) => c.id !== 'more').map((category) => (
            <Link key={category.id} to={`/category/${category.id}`} className="group flex items-center gap-3 px-4 py-[8px] text-[12px] text-pb-gray-text hover:bg-pb-green-light hover:text-pb-green-dark">
              <Icon name={category.icon} size={15} className="shrink-0 text-pb-gray-muted group-hover:text-pb-green" />
              <span className="min-w-0 flex-1 truncate">{category.name}</span>
              <Icon name="chevronRight" size={12} className="shrink-0 text-pb-gray-border group-hover:text-pb-green" />
            </Link>
          ))}
        </div>
        <Link to="/categories" className="flex items-center gap-2 border-t border-pb-gray-border bg-pb-gray-bg px-4 py-3 text-xs font-bold text-pb-green hover:bg-pb-green-light">
          <Icon name="grid" size={14} /> View all categories
        </Link>
      </nav>
    </aside>
  )
}
