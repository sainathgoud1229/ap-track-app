import { cn } from '../../lib/utils'

export default function Input({ label, className, ...props }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-sm text-zinc-400">{label}</span>}
      <input
        className={cn(
          'w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20',
          className
        )}
        {...props}
      />
    </label>
  )
}
