import { Link } from 'react-router-dom'

export default function BrandLogo({ compact = false, light = false, to = '/' }) {
  return (
    <Link to={to} aria-label="PowerBase home" className="group inline-flex items-center gap-2.5">
      <span className={`relative flex shrink-0 items-center justify-center ${compact ? 'h-9 w-9' : 'h-11 w-11'}`}>
        <svg viewBox="0 0 48 48" className="h-full w-full" aria-hidden="true">
          <path d="M10 8h15.5c8.3 0 13.5 4.7 13.5 12.1S33.8 32.2 25.5 32.2H18V40h-8V8Zm8 7v10h7.1c3.8 0 5.9-1.7 5.9-5s-2.1-5-5.9-5H18Z" fill={light ? '#ffffff' : '#087f43'} />
          <path d="M18 25h9.4c4.6 0 7.9-2.1 9.3-5.8v7.2c0 5.2-4.4 9.2-11.2 9.2H18V25Z" fill={light ? '#d7f4e3' : '#19a85c'} />
        </svg>
      </span>
      <span className="leading-none">
        <span className={`block font-extrabold tracking-[-0.04em] ${compact ? 'text-[17px]' : 'text-[20px]'} ${light ? 'text-white' : 'text-pb-gray-text'}`}>PowerBase</span>
        {!compact && <span className={`mt-1 block text-[10px] font-medium ${light ? 'text-white/70' : 'text-pb-gray-muted'}`}>Everything you need</span>}
      </span>
    </Link>
  )
}
