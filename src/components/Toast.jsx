export default function Toast({ message, visible }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-none fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-full bg-pb-gray-text px-4 py-2 text-sm font-medium text-white shadow-panel transition-opacity duration-200 lg:bottom-6 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {message}
    </div>
  )
}
