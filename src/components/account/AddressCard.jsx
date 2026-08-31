import Icon from '../Icon.jsx'

export default function AddressCard({ address, onEdit, onDelete, onSetDefault }) {
  return (
    <div className="flex flex-col gap-3 rounded-card border border-pb-gray-border bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-pb-green-light px-3 py-1 text-xs font-bold uppercase tracking-wide text-pb-green-dark">
          <Icon name="location" size={13} />
          {address.label || 'Address'}
        </span>
        {address.isDefault && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-pb-green-dark">
            <Icon name="checkCircle" size={14} />
            Default Address
          </span>
        )}
      </div>

      <div className="text-sm text-pb-gray-text">
        <p className="font-medium">
          {[address.city, address.area].filter(Boolean).join(', ') || 'No city/area set'}
        </p>
        {address.fullAddress && <p className="text-pb-gray-muted">{address.fullAddress}</p>}
        {address.landmark && <p className="text-pb-gray-muted">{address.landmark}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-pb-gray-border pt-3">
        <button
          type="button"
          onClick={() => onEdit(address)}
          className="flex items-center gap-1.5 rounded-full border border-pb-gray-border px-3.5 py-1.5 text-xs font-semibold text-pb-gray-text transition-colors hover:border-pb-green hover:text-pb-green"
        >
          <Icon name="edit" size={13} />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(address.id)}
          className="flex items-center gap-1.5 rounded-full border border-pb-gray-border px-3.5 py-1.5 text-xs font-semibold text-pb-gray-text transition-colors hover:border-pb-red hover:text-pb-red"
        >
          <Icon name="trash" size={13} />
          Delete
        </button>
        {!address.isDefault && (
          <button
            type="button"
            onClick={() => onSetDefault(address.id)}
            className="ml-auto text-xs font-semibold text-pb-green hover:text-pb-green-dark"
          >
            Set as Default
          </button>
        )}
      </div>
    </div>
  )
}
