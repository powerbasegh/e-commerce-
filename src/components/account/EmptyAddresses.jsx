import Icon from '../Icon.jsx'

export default function EmptyAddresses({ onAdd }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-pb-gray-border bg-white px-6 py-16 text-center shadow-card">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-pb-green-light text-pb-green">
        <Icon name="location" size={36} strokeWidth={1.4} />
      </span>
      <div>
        <p className="text-lg font-bold text-pb-gray-text">No saved addresses yet</p>
        <p className="mt-1 text-sm text-pb-gray-muted">
          Save a delivery address so checkout is faster next time.
        </p>
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-2 flex items-center gap-1.5 rounded-full bg-pb-green px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pb-green-dark"
      >
        <Icon name="plus" size={16} />
        Add Address
      </button>
    </div>
  )
}
