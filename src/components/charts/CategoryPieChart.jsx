import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { CHART_COLORS, chartTooltipStyle } from '../../lib/chartTheme'
import { formatMoney } from '../../lib/utils'

export default function CategoryPieChart({ data }) {
  if (!data?.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        No spending by category yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={chartTooltipStyle}
          formatter={(v) => formatMoney(v)}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}
