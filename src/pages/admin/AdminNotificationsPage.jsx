import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout.jsx'
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../../components/vendor/StateBlocks.jsx'
import Icon from '../../components/Icon.jsx'
import { api } from '../../services/api.js'

// Uses the same GET/PUT /api/notifications endpoints every role uses,
// scoped to the authenticated admin's own user_id — there is no separate
// admin-broadcast notification feed in the backend yet, so this shows
// exactly what exists rather than inventing an operational feed.
export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    setLoading(true); setError('')
    api.getNotifications().then((res) => setNotifications(res.notifications || [])).catch((e) => setError(e.message || 'Could not load notifications')).finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function markRead(id) {
    try { await api.markNotificationRead(id); load() } catch { /* non-fatal */ }
  }

  async function markAllRead() {
    try { await api.markAllNotificationsRead(); load() } catch { /* non-fatal */ }
  }

  const unread = notifications.filter((n) => !n.is_read).length

  return (
    <AdminLayout
      title="Notifications"
      actions={unread > 0 && (
        <button type="button" onClick={markAllRead} className="rounded-lg border border-pb-gray-border px-3.5 py-2 text-sm font-semibold text-pb-gray-text hover:bg-pb-gray-bg">
          Mark all as read
        </button>
      )}
    >
      {loading ? (
        <LoadingBlock label="Loading notifications…" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : notifications.length === 0 ? (
        <EmptyBlock icon="bell" title="No notifications" description="Nothing here yet for this admin account." />
      ) : (
        <ul className="divide-y divide-pb-gray-border rounded-card border border-pb-gray-border bg-white shadow-card">
          {notifications.map((n) => (
            <li key={n.id} className={`flex items-start gap-3 p-4 ${n.is_read ? '' : 'bg-pb-green-light/40'}`}>
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pb-gray-bg text-pb-gray-muted">
                <Icon name="bell" size={15} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-pb-gray-text">{n.title}</p>
                <p className="text-sm text-pb-gray-muted">{n.message}</p>
                <p className="mt-1 text-xs text-pb-gray-muted">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.is_read && (
                <button type="button" onClick={() => markRead(n.id)} className="shrink-0 text-xs font-semibold text-pb-green hover:underline">Mark read</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </AdminLayout>
  )
}
