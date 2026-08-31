import Icon from '../Icon.jsx'
import { NOTIFICATION_TYPE_LABEL } from '../../constants/notifications.js'

function formatTimestamp(isoString) {
  return new Date(isoString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function NotificationItem({ notification, onMarkRead }) {
  return (
    <div
      className={`flex gap-3 rounded-card border p-4 shadow-card sm:p-5 ${
        notification.read ? 'border-pb-gray-border bg-white' : 'border-pb-green bg-pb-green-light/40'
      }`}
    >
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pb-green-light text-pb-green">
        <Icon name="bell" size={16} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-pb-green-dark">
            {NOTIFICATION_TYPE_LABEL[notification.type] ?? 'Notification'}
          </p>
          {!notification.read && <span className="h-1.5 w-1.5 rounded-full bg-pb-red" />}
        </div>
        <p className="mt-1 text-sm font-medium text-pb-gray-text">{notification.title}</p>
        {notification.message && (
          <p className="text-sm text-pb-gray-muted">{notification.message}</p>
        )}
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-pb-gray-muted">{formatTimestamp(notification.createdAt)}</p>
          {!notification.read && (
            <button
              type="button"
              onClick={() => onMarkRead(notification.id)}
              className="text-xs font-semibold text-pb-green hover:text-pb-green-dark"
            >
              Mark as read
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
