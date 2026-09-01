import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Wrap any route element that requires a logged-in customer. Redirects to
 * /login (preserving where they were headed) if there's no valid session.
 * Waits for AuthContext's one-time token-restore check before deciding, so
 * a page refresh on an authenticated session doesn't briefly bounce to
 * /login before the token finishes validating.
 */
export function RequireAuth({ children }) {
  const { isAuthenticated, restoring } = useAuth()
  const location = useLocation()

  if (restoring) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-pb-gray-muted">Loading…</div>
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}

/**
 * Wrap any route element that requires a specific backend role (e.g.
 * ADMIN). This is a UI convenience only — every admin/vendor API endpoint
 * already enforces the role server-side (see server/src/middleware/auth.js
 * `authorize()`), so this guard just avoids showing the page shell to
 * someone who can't use it, not a security boundary by itself.
 */
export function RequireRole({ role, children }) {
  const { isAuthenticated, restoring, user } = useAuth()
  const location = useLocation()

  if (restoring) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-pb-gray-muted">Loading…</div>
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (user?.role !== role) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-lg font-bold text-pb-gray-text">You don't have access to this page</p>
        <p className="text-sm text-pb-gray-muted">This area is restricted to {role.toLowerCase()} accounts.</p>
      </div>
    )
  }
  return children
}
