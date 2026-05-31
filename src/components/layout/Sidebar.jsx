import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Home,
  CheckSquare,
  Target,
  Sparkles,
  Trophy,
  StickyNote,
  Calendar,
  FolderOpen,
  Wallet,
  Activity,
  Settings,
  Zap,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/skills', icon: Sparkles, label: 'Skills' },
  { to: '/achievements', icon: Trophy, label: 'Achievements' },
  { to: '/notes', icon: StickyNote, label: 'Notes' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/files', icon: FolderOpen, label: 'Files' },
  { to: '/finance', icon: Wallet, label: 'Finance (₹)' },
  { to: '/activity', icon: Activity, label: 'Activity' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}
      <motion.aside
        initial={false}
        className={cn(
          'app-sidebar fixed md:sticky top-0 z-50 flex h-screen w-[260px] flex-col',
          'transition-transform duration-300 ease-out md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex items-center gap-3 px-5 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-white">AP Track</p>
            <p className="text-xs text-zinc-500">Stay focused</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'nav-item flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive ? 'nav-item-active' : 'text-zinc-400 hover:text-zinc-100'
                )
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
      </motion.aside>
    </>
  )
}
