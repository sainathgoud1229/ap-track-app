import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns'

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function getDisplayName(user, profile) {
  if (profile?.displayName) return profile.displayName
  if (user?.displayName) return user.displayName
  if (user?.email) {
    const local = user.email.split('@')[0]
    return local.charAt(0).toUpperCase() + local.slice(1)
  }
  return 'User'
}

export function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U'
}

export function toDate(val) {
  if (!val) return null
  if (typeof val?.toDate === 'function') return val.toDate()
  if (typeof val === 'string') return parseISO(val)
  return val instanceof Date ? val : null
}

export function formatDate(date) {
  if (!date) return '—'
  const d = date?.toDate ? date.toDate() : typeof date === 'string' ? parseISO(date) : date
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'MMM d, yyyy')
}

export function isOverdue(date) {
  if (!date) return false
  const d = date?.toDate ? date.toDate() : typeof date === 'string' ? parseISO(date) : date
  return isPast(d) && !isToday(d)
}

export function calcProgress(current, target) {
  if (!target) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

export const TASK_STATUSES = ['todo', 'in_progress', 'done']
export const TASK_STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

export function formatMoney(amount, currency = 'INR') {
  const n = Number(amount) || 0
  const hasPaise = currency === 'INR' && n > 0 && n < 1000 && !Number.isInteger(n)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0,
  }).format(n)
}

/** Short form for charts: ₹1.2K, ₹3.5L */
export function formatMoneyShort(amount) {
  const n = Number(amount) || 0
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return formatMoney(n)
}

export const CURRENCY = 'INR'
export const CURRENCY_SYMBOL = '₹'

export const EXPENSE_CATEGORIES = [
  'Food & Groceries',
  'Transport',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Health',
  'Education',
  'Rent',
  'Other',
]

export const TAG_COLORS = [
  'bg-indigo-500/20 text-indigo-300',
  'bg-violet-500/20 text-violet-300',
  'bg-emerald-500/20 text-emerald-300',
  'bg-amber-500/20 text-amber-300',
  'bg-rose-500/20 text-rose-300',
]
