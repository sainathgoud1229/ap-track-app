import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, FileText, CheckSquare, Target, Sparkles, Wallet } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useCollection } from '../../hooks/useCollection'

const icons = {
  tasks: CheckSquare,
  notes: FileText,
  goals: Target,
  skills: Sparkles,
  expenses: Wallet,
}

export default function GlobalSearch({ open, onClose }) {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const { docs: tasks } = useCollection(user?.id, 'tasks')
  const { docs: notes } = useCollection(user?.id, 'notes')
  const { docs: goals } = useCollection(user?.id, 'goals')
  const { docs: skills } = useCollection(user?.id, 'skills')
  const { docs: expenses } = useCollection(user?.id, 'expenses', 'date')

  const results = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return []

    const items = [
      ...tasks.map((t) => ({ type: 'tasks', label: t.title, path: '/tasks', id: t.id })),
      ...notes.map((n) => ({ type: 'notes', label: n.title, path: '/notes', id: n.id })),
      ...goals.map((g) => ({ type: 'goals', label: g.title, path: '/goals', id: g.id })),
      ...skills.map((s) => ({ type: 'skills', label: s.name, path: '/skills', id: s.id })),
      ...expenses.map((e) => ({ type: 'expenses', label: e.title, path: '/finance', id: e.id })),
    ]

    return items.filter((i) => i.label?.toLowerCase().includes(q)).slice(0, 12)
  }, [query, tasks, notes, goals, skills, expenses])

  const go = (path) => {
    navigate(path)
    onClose()
    setQuery('')
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="glass glow-accent relative z-10 w-full max-w-xl overflow-hidden rounded-2xl"
          >
            <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
              <Search size={18} className="text-zinc-500" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks, notes, goals, skills, expenses..."
                className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
              />
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {query && results.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-zinc-500">No results found</p>
              )}
              {results.map((r) => {
                const Icon = icons[r.type]
                return (
                  <button
                    key={`${r.type}-${r.id}`}
                    onClick={() => go(r.path)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-white/5"
                  >
                    <Icon size={16} className="text-indigo-400" />
                    <span className="text-zinc-200">{r.label}</span>
                    <span className="ml-auto text-xs capitalize text-zinc-500">{r.type}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
