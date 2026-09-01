import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api.js'

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------
// Talks to the real backend (server/src/controllers/authController.js) —
// register/login/logout/session-restore/profile. This is the piece every
// other "frontend-first, backend-ready" context in this project (Cart,
// Account) was written to plug into once it existed.
//
// Token storage: a plain JWT in localStorage under TOKEN_KEY. src/services/
// api.js already reads this exact key on every request, so nothing else
// needs to change for authenticated API calls to start working once a user
// logs in.
// ---------------------------------------------------------------------------

const TOKEN_KEY = 'powerbase_token'
const USER_KEY = 'powerbase_user'

const AuthContext = createContext(null)

function loadStoredUser() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() =>
    typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY),
  )
  const [user, setUser] = useState(loadStoredUser)
  // true while we're re-validating a stored token against /auth/profile on
  // first load — lets pages/guards avoid a flash of "logged out" content.
  const [restoring, setRestoring] = useState(Boolean(token))
  const [error, setError] = useState('')

  function persistSession(nextToken, nextUser) {
    setToken(nextToken)
    setUser(nextUser)
    if (typeof window !== 'undefined') {
      if (nextToken) window.localStorage.setItem(TOKEN_KEY, nextToken)
      else window.localStorage.removeItem(TOKEN_KEY)
      if (nextUser) window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
      else window.localStorage.removeItem(USER_KEY)
    }
  }

  // On first load, if a token was saved from a previous session, confirm
  // it's still valid (and refresh the cached user) by calling
  // GET /auth/profile rather than trusting the cached copy indefinitely.
  useEffect(() => {
    let cancelled = false
    if (!token) {
      setRestoring(false)
      return
    }
    api
      .getProfile()
      .then((data) => {
        if (cancelled) return
        persistSession(token, data.user)
      })
      .catch(() => {
        if (cancelled) return
        // Expired/invalid token — clear the stale session rather than
        // leaving the UI thinking it's authenticated.
        persistSession(null, null)
      })
      .finally(() => {
        if (!cancelled) setRestoring(false)
      })
    return () => {
      cancelled = true
    }
    // Only ever re-validate the token we started with; login()/register()
    // set a fresh user directly and don't need this effect to re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const actions = useMemo(
    () => ({
      async login(credentials) {
        setError('')
        try {
          const data = await api.login(credentials)
          persistSession(data.token, data.user)
          return data.user
        } catch (e) {
          setError(e.message || 'Login failed')
          throw e
        }
      },
      async register(userData) {
        setError('')
        try {
          const data = await api.register(userData)
          persistSession(data.token, data.user)
          return data.user
        } catch (e) {
          setError(e.message || 'Registration failed')
          throw e
        }
      },
      logout() {
        persistSession(null, null)
      },
      clearError() {
        setError('')
      },
    }),
    [],
  )

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    restoring,
    error,
    ...actions,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
