import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { mobileCategories } from '../data/mockData.js'

export default function MobileCategoryRow() {
  return (
    <nav aria-label="Categories" className="no-scrollbar -mx-3.5 flex gap-4 overflow-x-auto px-3.5 sm:-mx-4 sm:px-4 lg:hidden">
      {mobileCategories.map((category) => (
        <Link key={category.id} to={category.id === 'more' ? '/categories' : `/category/${category.id}`} className="flex w-[64px] shrink-0 flex-col items-center gap-1.5">
          <span className={`flex h-12 w-12 items-center justify-center rounded-full border ${category.id === 'more' ? 'border-pb-green bg-pb-green text-white' : 'border-pb-gray-border bg-white text-pb-gray-text'}`}>
            <Icon name={category.icon} size={19} />
          </span>
          <span className="line-clamp-2 text-center text-[10px] font-bold leading-tight text-pb-gray-text">{category.name}</span>
        </Link>
      ))}
    </nav>
  )
}
