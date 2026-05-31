import Card from '../ui/Card'

export default function ChartCard({ title, subtitle, action, children, className }) {
  return (
    <Card className={className} hover={false}>
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-white">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="h-[240px] w-full min-w-0">{children}</div>
    </Card>
  )
}
