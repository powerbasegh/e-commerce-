import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'

export default function MobileSearch() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = query.trim()
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search')
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="flex items-center gap-2 rounded-sm border border-pb-gray-border bg-white px-3.5 py-2.5 lg:hidden"
    >
      <Icon name="search" size={17} className="shrink-0 text-pb-gray-muted" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products"
        className="w-full min-w-0 bg-transparent text-sm text-pb-gray-text placeholder:text-pb-gray-muted focus:outline-none"
      />
    </form>
  )
}
