import Icon from './Icon.jsx'
import { trustSectionShort } from '../data/mockData.js'

// Small reassurance box that sits directly under the desktop category
// sidebar's "View all categories" link (see reference layout: sidebar list
// + "Why shop with us?" panel stacked in the same left column). Reuses the
// existing trustSectionShort data — no new content source.
export default function SidebarTrustPanel() {
  return (
    <aside
      aria-label="Why shop with us"
      className="hidden w-[190px] shrink-0 flex-col gap-3 rounded-lg border border-pb-gray-border bg-white p-3.5 lg:flex"
    >
      <p className="text-[12px] font-extrabold text-pb-gray-text">Why shop with us?</p>

      <ul className="flex flex-col gap-3">
        {trustSectionShort.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pb-green-light text-pb-green">
              <Icon name={item.icon} size={14} />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-bold leading-tight text-pb-gray-text">{item.title}</span>
              <span className="block text-[9px] leading-snug text-pb-gray-muted">{item.description}</span>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  )
}
