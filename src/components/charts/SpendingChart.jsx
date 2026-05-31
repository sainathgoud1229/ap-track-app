import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { chartAxisStyle, chartGridStyle, chartTooltipStyle } from '../../lib/chartTheme'
import { formatMoney, formatMoneyShort } from '../../lib/utils'

export default function SpendingChart({ data }) {
  if (!data?.length || data.every((d) => d.amount === 0)) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        Add expenses to track spending over time
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={chartGridStyle.stroke} />
        <XAxis dataKey="date" tick={chartAxisStyle} axisLine={false} tickLine={false} />
        <YAxis tick={chartAxisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => formatMoneyShort(v)} />
        <Tooltip
          contentStyle={chartTooltipStyle}
          formatter={(v) => [formatMoney(v), 'Spent']}
        />
        <Area type="monotone" dataKey="amount" stroke="#f59e0b" fill="url(#spendGrad)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
