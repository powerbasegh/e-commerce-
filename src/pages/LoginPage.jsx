import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { validateEmail, isRequired } from '../utils/validation.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const redirectTo = location.state?.from || '/account'

  function validate() {
    const next = {
      email: validateEmail(email),
      password: isRequired(password) ? null : 'Password is required',
    }
    const cleaned = Object.fromEntries(Object.entries(next).filter(([, v]) => v))
    setErrors(cleaned)
    return Object.keys(cleaned).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setServerError('')
    if (!validate()) return
    setSubmitting(true)
    try {
      await login({ email: email.trim(), password })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setServerError(err.message || 'Could not log in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-pb-gray-bg px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-card border border-pb-gray-border bg-white p-6 shadow-card"
      >
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-pb-green text-lg font-bold text-white">
            P
          </span>
          <h1 className="mt-1 text-lg font-bold text-pb-gray-text">Log in to PowerBase</h1>
          <p className="text-xs text-pb-gray-muted">Welcome back — enter your details to continue.</p>
        </div>

        {serverError && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-pb-red">{serverError}</p>
        )}

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-pb-gray-text">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 ${
              errors.email ? 'border-pb-red focus:ring-pb-red' : 'border-pb-gray-border focus:border-pb-green focus:ring-pb-green'
            }`}
            placeholder="you@example.com"
          />
          {errors.email && <span className="text-xs text-pb-red">{errors.email}</span>}
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-pb-gray-text">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 ${
              errors.password ? 'border-pb-red focus:ring-pb-red' : 'border-pb-gray-border focus:border-pb-green focus:ring-pb-green'
            }`}
            placeholder="••••••••"
          />
          {errors.password && <span className="text-xs text-pb-red">{errors.password}</span>}
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 w-full rounded-card bg-pb-green py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pb-green-dark disabled:opacity-60"
        >
          {submitting ? 'Logging in…' : 'Log In'}
        </button>

        <p className="text-center text-xs text-pb-gray-muted">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-pb-green hover:underline">
            Create one
          </Link>
        </p>
      </form>
    </div>
  )
}
