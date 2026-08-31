import FormField, { inputClass, inputErrorClass } from './FormField.jsx'

// The customer info is currently entered by hand each checkout. Kept as a
// flat { fullName, email, phone } shape — matching src/data/deliveryDetails.js
// — so it's a one-line swap to pre-fill from an authenticated profile later
// without changing this component.
export default function CustomerInfoForm({ value, errors, onChange }) {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-pb-gray-border bg-white p-4 shadow-card sm:p-5">
      <h2 className="text-sm font-bold text-pb-gray-text sm:text-base">Customer Information</h2>

      <FormField label="Full Name" required error={errors.fullName}>
        <input
          type="text"
          value={value.fullName}
          onChange={(e) => onChange('fullName', e.target.value)}
          placeholder="e.g. Ama Owusu"
          className={errors.fullName ? inputErrorClass : inputClass}
        />
      </FormField>

      <FormField label="Email Address" required error={errors.email}>
        <input
          type="email"
          value={value.email}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="e.g. ama@example.com"
          className={errors.email ? inputErrorClass : inputClass}
        />
      </FormField>

      <FormField label="Phone Number" required error={errors.phone}>
        <input
          type="tel"
          value={value.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="e.g. 024 123 4567"
          className={errors.phone ? inputErrorClass : inputClass}
        />
      </FormField>
    </section>
  )
}
