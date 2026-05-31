import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '../../lib/utils'

const config = {
  improving: {
    icon: TrendingUp,
    label: 'Improving',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  },
  declining: {
    icon: TrendingDown,
    label: 'Declining',
    className: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
  },
  stable: {
    icon: Minus,
    label: 'Stable',
    className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
  },
}

export default function TrendBadge({ direction, delta, showDelta = true, size = 'sm' }) {
  const { icon: Icon, label, className } = config[direction] || config.stable

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        className
      )}
    >
      <Icon size={size === 'sm' ? 12 : 14} />
      {label}
      {showDelta && delta !== 0 && (
        <span className="opacity-80">
          {delta > 0 ? '+' : ''}
          {delta}
        </span>
      )}
    </span>
  )
}
