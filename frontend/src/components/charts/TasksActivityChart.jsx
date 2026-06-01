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

export default function TasksActivityChart({ data }) {
  if (!data?.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        Complete tasks to see activity
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartGridStyle.stroke} vertical={false} />
        <XAxis dataKey="date" tick={chartAxisStyle} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={chartAxisStyle} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={chartTooltipStyle} />
        <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
