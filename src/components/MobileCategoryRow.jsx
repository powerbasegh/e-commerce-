import Icon from './Icon.jsx'
import { mobileCategories } from '../data/mockData.js'

export default function MobileCategoryRow() {
  return (
    <nav aria-label="Categories" className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 lg:hidden">
      {mobileCategories.map((category) => (
        <a
          key={category.id}
          href={category.id === 'more' ? '/categories' : `/category/${category.id}`}
          className="flex shrink-0 flex-col items-center gap-1.5"
        >
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              category.id === 'more'
                ? 'bg-pb-green text-white'
                : 'bg-pb-gray-bg text-pb-gray-text'
            }`}
          >
            <Icon name={category.icon} size={20} />
          </span>
          <span className="text-xs text-pb-gray-text">{category.name}</span>
        </a>
      ))}
    </nav>
  )
}
