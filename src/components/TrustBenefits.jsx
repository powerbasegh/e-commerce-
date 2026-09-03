import Icon from './Icon.jsx'

const BENEFITS = [
  ['users', 'Trusted by Thousands', 'Happy customers across Ghana'],
  ['refresh', 'Easy Returns', 'Simple return process'],
  ['shield', 'Quality Guaranteed', 'Original products'],
  ['secure', 'Shop with Confidence', 'Secure checkout'],
]

export default function TrustBenefits({ variant = 'desktop' }) {
  if (variant === 'mobile') return null
  return (
    <section className="grid grid-cols-4 overflow-hidden rounded-xl border border-pb-gray-border bg-[#f4faf6]">
      {BENEFITS.map(([icon, title, text]) => <div key={title} className="flex items-center gap-3 border-r border-pb-gray-border px-4 py-3.5 last:border-r-0"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-pb-green"><Icon name={icon} size={17} /></span><div className="min-w-0"><p className="text-[10px] font-extrabold text-pb-gray-text">{title}</p><p className="mt-0.5 truncate text-[9px] text-pb-gray-muted">{text}</p></div></div>)}
    </section>
  )
}
