import { useState } from 'react'
import FormField, { inputClass, inputErrorClass } from '../checkout/FormField.jsx'
import { validateFullName, validateEmail, validatePhone } from '../../utils/validation.js'
import { useAccount } from '../../context/AccountContext.jsx'

export default function ProfileForm() {
  const { profile, updateProfile } = useAccount()

  const [form, setForm] = useState({
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
  })
  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  function handleSave(e) {
    e.preventDefault()
    const nextErrors = {
      fullName: validateFullName(form.fullName),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone),
    }
    const cleaned = Object.fromEntries(Object.entries(nextErrors).filter(([, v]) => v))
    setErrors(cleaned)
    if (Object.keys(cleaned).length > 0) return

    updateProfile({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    })
    setSaved(true)
  }

  const initials = form.fullName
    ? form.fullName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : null

  return (
    <form
      onSubmit={handleSave}
      className="flex flex-col gap-4 rounded-card border border-pb-gray-border bg-white p-4 shadow-card sm:p-5"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-pb-green-light text-lg font-bold text-pb-green-dark">
          {initials ?? '👤'}
        </span>
        <div>
          <p className="text-sm font-semibold text-pb-gray-text">Profile Photo</p>
          <p className="text-xs text-pb-gray-muted">Photo uploads are coming soon.</p>
        </div>
      </div>

      <FormField label="Full Name" required error={errors.fullName}>
        <input
          type="text"
          value={form.fullName}
          onChange={(e) => updateField('fullName', e.target.value)}
          placeholder="e.g. Ama Owusu"
          className={errors.fullName ? inputErrorClass : inputClass}
        />
      </FormField>

      <FormField label="Email Address" required error={errors.email}>
        <input
          type="email"
          value={form.email}
          onChange={(e) => updateField('email', e.target.value)}
          placeholder="e.g. ama@example.com"
          className={errors.email ? inputErrorClass : inputClass}
        />
      </FormField>

      <FormField label="Phone Number" required error={errors.phone}>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          placeholder="e.g. 024 123 4567"
          className={errors.phone ? inputErrorClass : inputClass}
        />
      </FormField>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-full bg-pb-green px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pb-green-dark"
        >
          Save Changes
        </button>
        {saved && <span className="text-sm font-medium text-pb-green-dark">Profile updated ✓</span>}
      </div>
    </form>
  )
}
