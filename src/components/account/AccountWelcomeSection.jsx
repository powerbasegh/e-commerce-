export default function AccountWelcomeSection({ name }) {
  const initials = name
    ? name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : null

  return (
    <div className="flex items-center gap-4 rounded-card border border-pb-gray-border bg-white p-4 shadow-card sm:p-5">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-pb-green-light text-lg font-bold text-pb-green-dark">
        {initials ?? '👋'}
      </span>
      <div>
        <p className="text-lg font-bold text-pb-gray-text sm:text-xl">
          {name ? `Hello, ${name} 👋` : 'Welcome 👋'}
        </p>
        <p className="text-sm text-pb-gray-muted">Welcome back to PowerBase.</p>
      </div>
    </div>
  )
}
