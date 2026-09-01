import Icon from './Icon.jsx'
import { categories } from '../data/mockData.js'

export default function Sidebar() {
  return (
    <aside className="hidden w-[220px] shrink-0 xl:flex xl:flex-col" aria-label="Category navigation">
      <nav className="overflow-hidden rounded-b-xl border border-pb-gray-border bg-white shadow-card">
        {categories.filter((c) => c.id !== 'more').map((category) => (
          <a key={category.id} href={`/category/${category.id}`}
            className="group flex items-center gap-3 px-4 py-[8px] text-[13px] text-pb-gray-text transition hover:bg-pb-green-light hover:font-semibold hover:text-pb-green-dark">
            <Icon name={category.icon} size={16} className="shrink-0 text-pb-gray-muted group-hover:text-pb-green" />
            <span className="min-w-0 flex-1 truncate">{category.name}</span>
            <Icon name="chevronRight" size={13} className="text-pb-gray-border group-hover:text-pb-green" />
          </a>
        ))}
        <a href="/categories" className="flex items-center gap-3 border-t border-pb-gray-border px-4 py-3 text-[13px] font-semibold text-pb-green hover:bg-pb-green-light">
          <Icon name="grid" size={16} /> View all categories <Icon name="arrowRight" size={14} className="ml-auto" />
        </a>
      </nav>

      <div className="mt-4 rounded-xl border border-pb-gray-border bg-pb-green-light/60 p-4 shadow-card">
        {[
          ['secure', 'Secure Payments', '100% safe & secure payments'],
          ['shield', 'Buyer Protection', 'Get your money back'],
          ['delivery', 'Reliable Delivery', 'Fast delivery to your door'],
          ['support', '24/7 Customer Support', 'We are here to help'],
        ].map(([icon, title, text]) => (
          <div key={title} className="flex items-start gap-3 py-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-pb-green"><Icon name={icon} size={14} /></span>
            <div><p className="text-[11px] font-bold text-pb-gray-text">{title}</p><p className="text-[10px] text-pb-gray-muted">{text}</p></div>
          </div>
        ))}
      </div>
    </aside>
  )
}
