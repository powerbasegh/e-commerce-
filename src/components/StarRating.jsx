import Icon from './Icon.jsx'

export default function StarRating({ value, size = 13 }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-pb-gray-muted">
      <Icon name="star" size={size} filled className="text-pb-amber" strokeWidth={0} />
      <span className="font-medium text-pb-gray-text">{value.toFixed(1)}</span>
    </span>
  )
}
