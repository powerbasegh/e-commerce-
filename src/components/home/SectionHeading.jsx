import { Link } from 'react-router-dom'
import Icon from '../Icon.jsx'

export default function SectionHeading({ title, viewAllHref }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-bold text-pb-gray-text sm:text-lg">{title}</h2>
      {viewAllHref && (
        <Link to={viewAllHref} className="flex items-center gap-0.5 text-xs font-semibold text-pb-green hover:text-pb-green-dark">
          See all
          <Icon name="chevronRight" size={13} />
        </Link>
      )}
    </div>
  )
}
