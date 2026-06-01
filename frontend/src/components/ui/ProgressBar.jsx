import { cn } from '../../lib/utils'

export default function ProgressBar({ value, className, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    violet: 'bg-violet-500',
  }

  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-white/10', className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', colors[color])}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  )
}
