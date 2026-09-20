import Icon from '../Icon.jsx'

export function LoadingBlock({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-[160px] items-center justify-center rounded-card border border-pb-gray-border bg-white text-sm text-pb-gray-muted">
      {label}
    </div>
  )
}

export function ErrorBlock({ message, onRetry }) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-card border border-pb-red/20 bg-pb-red/5 p-6 text-center">
      <p className="text-sm font-medium text-pb-red">{message || 'Something went wrong.'}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-pb-red/30 px-4 py-2 text-sm font-semibold text-pb-red hover:bg-pb-red/10"
        >
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyBlock({ icon = 'box', title, description, action }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-card border border-dashed border-pb-gray-border bg-white p-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pb-gray-bg text-pb-gray-muted">
        <Icon name={icon} size={22} />
      </span>
      <p className="text-sm font-semibold text-pb-gray-text">{title}</p>
      {description && <p className="max-w-sm text-xs text-pb-gray-muted">{description}</p>}
      {action}
    </div>
  )
}
