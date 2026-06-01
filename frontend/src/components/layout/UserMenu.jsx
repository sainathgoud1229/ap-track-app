import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, LogOut, ChevronDown, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useDocument } from '../../hooks/useDocument'
import { getDisplayName, getInitials, cn } from '../../lib/utils'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const { data: profile } = useDocument(user?.uid ? ['users', user.uid] : null)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const name = getDisplayName(user, profile)
  const initials = getInitials(name)
  const email = user?.email

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3',
          'transition-all duration-200 hover:border-indigo-500/40 hover:bg-white/8 hover:shadow-lg hover:shadow-indigo-500/10',
          open && 'border-indigo-500/40 bg-white/8 shadow-lg shadow-indigo-500/10'
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-semibold text-white shadow-md shadow-indigo-500/30">
          {initials}
        </div>
        <div className="hidden text-left sm:block">
          <p className="max-w-[140px] truncate text-sm font-medium leading-tight text-white">{name}</p>
          {email && (
            <p className="max-w-[140px] truncate text-[11px] leading-tight text-zinc-500">{email}</p>
          )}
        </div>
        <ChevronDown
          size={16}
          className={cn('hidden text-zinc-500 transition-transform sm:block', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="user-menu-dropdown absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#12121a]/95 shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            <div className="border-b border-white/5 px-4 py-3 sm:hidden">
              <p className="font-medium text-white">{name}</p>
              {email && <p className="truncate text-xs text-zinc-500">{email}</p>}
            </div>
            <div className="p-1.5">
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
              >
                <User size={16} className="text-zinc-500" />
                Profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
              >
                <Settings size={16} className="text-zinc-500" />
                Settings
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  logout()
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-rose-300/90 transition hover:bg-rose-500/10"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
