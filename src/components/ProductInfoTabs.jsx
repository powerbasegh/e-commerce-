import { useState } from 'react'

const TABS = [
  { id: 'description', label: 'Description' },
  { id: 'specifications', label: 'Specifications' },
]

export default function ProductInfoTabs({ description, specs }) {
  const [activeTab, setActiveTab] = useState('description')

  return (
    <div className="rounded-card border border-pb-gray-border bg-white shadow-card">
      <div role="tablist" aria-label="Product information" className="flex border-b border-pb-gray-border">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                isActive ? 'text-pb-green' : 'text-pb-gray-muted hover:text-pb-gray-text'
              }`}
            >
              {tab.label}
              {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-pb-green" />}
            </button>
          )
        })}
      </div>

      <div className="p-4 sm:p-5">
        {activeTab === 'description' ? (
          <p className="text-sm leading-relaxed text-pb-gray-text">{description}</p>
        ) : (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            {specs.map((spec) => (
              <div key={spec.label} className="flex justify-between border-b border-pb-gray-border pb-2 text-sm sm:justify-start sm:gap-4">
                <dt className="text-pb-gray-muted">{spec.label}</dt>
                <dd className="font-medium text-pb-gray-text">{spec.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  )
}
