import { useState } from 'react'
import Icon from './Icon.jsx'

export default function MobileSearch() {
  const [query, setQuery] = useState('')

  return (
    <form
      role="search"
      onSubmit={(e) => e.preventDefault()}
      className="flex items-center gap-2 rounded-full border border-pb-gray-border bg-pb-gray-bg px-3.5 py-2.5 lg:hidden"
    >
      <Icon name="search" size={17} className="shrink-0 text-pb-gray-muted" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for products, brands and more..."
        className="w-full min-w-0 bg-transparent text-sm text-pb-gray-text placeholder:text-pb-gray-muted focus:outline-none"
      />
      <button
        type="button"
        aria-label="Search by image"
        className="shrink-0 text-pb-gray-muted"
      >
        <Icon name="camera" size={18} />
      </button>
    </form>
  )
}
