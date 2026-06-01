import { LineChart, Line, ResponsiveContainer } from 'recharts'

export default function SkillSparkline({ points, improving }) {
  const data = points.map((p, i) => ({ i, v: p.value }))
  if (data.length < 2) return null

  const color = improving === 'improving' ? '#10b981' : improving === 'declining' ? '#f43f5e' : '#71717a'

  return (
    <div className="h-10 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
