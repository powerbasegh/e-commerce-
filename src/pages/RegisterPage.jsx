import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { validateFullName, validateEmail, validatePhone } from '../utils/validation.js'

// Matches the backend's own rule (authController.register: password.length
// < 8 is rejected) — validated client-side too so the customer sees the
// problem before submitting, not just after a 400 comes back.
function validatePassword(value) {
  if (!value) return 'Password is required'
  if (value.length < 8) return 'Password must be at least 8 characters'
  return null
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  function validate() {
    const next = {
      fullName: validateFullName(fullName),
      email: validateEmail(email),
      phone: validatePhone(phone),
      password: validatePassword(password),
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
      await register({ fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), password })
      navigate('/account', { replace: true })
    } catch (err) {
      setServerError(err.message || 'Could not create your account')
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
          <h1 className="mt-1 text-lg font-bold text-pb-gray-text">Create your PowerBase account</h1>
          <p className="text-xs text-pb-gray-muted">Track orders, save addresses, and check out faster.</p>
        </div>

        {serverError && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-pb-red">{serverError}</p>
        )}

        {[
          { key: 'fullName', label: 'Full Name', type: 'text', value: fullName, set: setFullName, placeholder: 'Ama Owusu' },
          { key: 'email', label: 'Email', type: 'email', value: email, set: setEmail, placeholder: 'you@example.com' },
          { key: 'phone', label: 'Phone', type: 'tel', value: phone, set: setPhone, placeholder: '024 123 4567' },
          { key: 'password', label: 'Password', type: 'password', value: password, set: setPassword, placeholder: 'At least 8 characters' },
        ].map((field) => (
          <label key={field.key} className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-pb-gray-text">{field.label}</span>
            <input
              type={field.type}
              value={field.value}
              onChange={(e) => field.set(e.target.value)}
              placeholder={field.placeholder}
              className={`rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 ${
                errors[field.key]
                  ? 'border-pb-red focus:ring-pb-red'
                  : 'border-pb-gray-border focus:border-pb-green focus:ring-pb-green'
              }`}
            />
            {errors[field.key] && <span className="text-xs text-pb-red">{errors[field.key]}</span>}
          </label>
        ))}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 w-full rounded-card bg-pb-green py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pb-green-dark disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Create Account'}
        </button>

        <p className="text-center text-xs text-pb-gray-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-pb-green hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  )
}
