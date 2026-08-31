import { useState } from 'react'
import FormField, { inputClass, inputErrorClass } from '../checkout/FormField.jsx'
import { isRequired } from '../../utils/validation.js'

const LABEL_PRESETS = ['Home', 'Work', 'Other']

export default function AddressFormPanel({ initialAddress, onSave, onCancel }) {
  const [form, setForm] = useState({
    label: initialAddress?.label ?? '',
    fullAddress: initialAddress?.fullAddress ?? '',
    city: initialAddress?.city ?? '',
    area: initialAddress?.area ?? '',
    landmark: initialAddress?.landmark ?? '',
    deliveryInstructions: initialAddress?.deliveryInstructions ?? '',
  })
  const [errors, setErrors] = useState({})

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const nextErrors = {
      label: isRequired(form.label) ? null : 'Address label is required',
      fullAddress: isRequired(form.fullAddress) ? null : 'Address is required',
      city: isRequired(form.city) ? null : 'City is required',
      area: isRequired(form.area) ? null : 'Area is required',
    }
    const cleaned = Object.fromEntries(Object.entries(nextErrors).filter(([, v]) => v))
    setErrors(cleaned)
    if (Object.keys(cleaned).length > 0) return

    onSave({
      label: form.label.trim(),
      fullAddress: form.fullAddress.trim(),
      city: form.city.trim(),
      area: form.area.trim(),
      landmark: form.landmark.trim(),
      deliveryInstructions: form.deliveryInstructions.trim(),
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-card border border-pb-green bg-white p-4 shadow-card sm:p-5"
    >
      <h2 className="text-sm font-bold text-pb-gray-text sm:text-base">
        {initialAddress ? 'Edit Address' : 'Add Address'}
      </h2>

      <FormField label="Address Label" required error={errors.label}>
        <div className="flex flex-wrap gap-2">
          {LABEL_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => updateField('label', preset)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                form.label === preset
                  ? 'border-pb-green bg-pb-green-light text-pb-green-dark'
                  : 'border-pb-gray-border text-pb-gray-text hover:border-pb-green'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={form.label}
          onChange={(e) => updateField('label', e.target.value)}
          placeholder="e.g. Home, Work, Other"
          className={`mt-1 ${errors.label ? inputErrorClass : inputClass}`}
        />
      </FormField>

      <FormField label="Full Address" required error={errors.fullAddress}>
        <input
          type="text"
          value={form.fullAddress}
          onChange={(e) => updateField('fullAddress', e.target.value)}
          placeholder="House number, street name"
          className={errors.fullAddress ? inputErrorClass : inputClass}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="City" required error={errors.city}>
          <input
            type="text"
            value={form.city}
            onChange={(e) => updateField('city', e.target.value)}
            placeholder="e.g. Kumasi"
            className={errors.city ? inputErrorClass : inputClass}
          />
        </FormField>
        <FormField label="Area" required error={errors.area}>
          <input
            type="text"
            value={form.area}
            onChange={(e) => updateField('area', e.target.value)}
            placeholder="e.g. Asafo"
            className={errors.area ? inputErrorClass : inputClass}
          />
        </FormField>
      </div>

      <FormField label="Landmark (optional)">
        <input
          type="text"
          value={form.landmark}
          onChange={(e) => updateField('landmark', e.target.value)}
          placeholder="e.g. Near the main gate"
          className={inputClass}
        />
      </FormField>

      <FormField label="Delivery Instructions (optional)">
        <textarea
          value={form.deliveryInstructions}
          onChange={(e) => updateField('deliveryInstructions', e.target.value)}
          placeholder="e.g. Call on arrival, blue gate"
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </FormField>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          className="rounded-full bg-pb-green px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-pb-green-dark"
        >
          Save Address
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-semibold text-pb-gray-muted hover:text-pb-gray-text"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
