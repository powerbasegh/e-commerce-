import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'

export default function BottomNav({ activeId = 'home' }) {
  const items = [['home','Home','/'],['grid','Categories','/categories'],['user','Account','/account'],['orders','Orders','/orders'],['menu','More','/support']]
  return <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-pb-gray-border bg-white/98 px-2 pb-[env(safe-area-inset-bottom)] lg:hidden"><div className="mx-auto grid max-w-lg grid-cols-5">{items.map(([id,label,href])=><Link key={id} to={href} className={`flex min-h-[58px] flex-col items-center justify-center gap-1 text-[9px] font-bold ${activeId===id?'text-pb-green':'text-pb-gray-muted'}`}><Icon name={id} size={18}/><span>{label}</span></Link>)}</div></nav>
}
