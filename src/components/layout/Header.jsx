import { Menu, Search, Moon, Sun } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import UserMenu from './UserMenu'

export default function Header({ title, onMenuClick, onSearchClick }) {
  const { dark, toggleTheme } = useTheme()

  return (
    <header className="app-header sticky top-0 z-30 flex items-center justify-between gap-4 px-4 py-3 md:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2.5 text-zinc-400 transition hover:bg-white/5 hover:text-white md:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wider text-indigo-400/80">AP Track</p>
          <h1 className="truncate text-lg font-semibold text-white md:text-xl">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm text-zinc-400 transition hover:border-white/10 hover:bg-white/5 hover:text-white"
          aria-label="Search"
        >
          <Search size={18} />
          <span className="hidden lg:inline">Search</span>
        </button>

        <button
          onClick={toggleTheme}
          className="rounded-xl p-2.5 text-zinc-400 transition hover:bg-white/5 hover:text-amber-300"
          aria-label="Toggle theme"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="mx-1 hidden h-8 w-px bg-white/10 sm:block" />

        <UserMenu />
      </div>
    </header>
  )
}
