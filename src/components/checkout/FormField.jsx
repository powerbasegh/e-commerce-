export default function FormField({
  label,
  required = false,
  error,
  children,
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-pb-gray-text">
        {label}
        {required && <span className="ml-0.5 text-pb-red">*</span>}
      </span>
      {children}
      {error && <span className="text-xs text-pb-red">{error}</span>}
    </label>
  )
}

export const inputClass =
  'w-full rounded-lg border border-pb-gray-border bg-white px-3 py-2.5 text-sm text-pb-gray-text placeholder:text-pb-gray-muted focus:border-pb-green focus:outline-none'

export const inputErrorClass =
  'w-full rounded-lg border border-pb-red bg-white px-3 py-2.5 text-sm text-pb-gray-text placeholder:text-pb-gray-muted focus:border-pb-red focus:outline-none'
