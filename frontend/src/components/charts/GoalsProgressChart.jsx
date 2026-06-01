import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { chartAxisStyle, chartGridStyle, chartTooltipStyle } from '../../lib/chartTheme'

export default function GoalsProgressChart({ data }) {
  if (!data?.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        Add goals to track progress
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartGridStyle.stroke} horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={chartAxisStyle} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={90} tick={chartAxisStyle} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`${v}%`, 'Progress']} />
        <Bar dataKey="progress" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
