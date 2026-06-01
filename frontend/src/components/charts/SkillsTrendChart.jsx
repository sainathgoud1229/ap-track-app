import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { CHART_COLORS, chartAxisStyle, chartGridStyle, chartTooltipStyle } from '../../lib/chartTheme'

export default function SkillsTrendChart({ data, skillNames = [] }) {
  if (!data?.length) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
        Update skill levels to see progress over time
      </div>
    )
  }

  const names = skillNames.length
    ? skillNames
    : Object.keys(data[0]).filter((k) => k !== 'date')

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={chartGridStyle.stroke} />
        <XAxis dataKey="date" tick={chartAxisStyle} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={chartAxisStyle} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={chartTooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} />
        {names.map((name, i) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
