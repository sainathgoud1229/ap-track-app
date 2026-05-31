import { format, subDays, parseISO, isSameMonth } from 'date-fns'
import { toDate } from './utils'

export function buildMetricEntry({ type, refId, label, value, previousValue, meta = {} }) {
  const prev = previousValue != null ? Number(previousValue) : null
  const val = Number(value)
  return {
    type,
    refId: refId || null,
    label,
    value: val,
    previousValue: prev,
    delta: prev != null ? val - prev : 0,
    meta,
    recordedAt: new Date().toISOString(),
  }
}

export function getRecordedAt(m) {
  return toDate(m.recordedAt) || toDate(m.createdAt)
}

export function getSkillTrend(metrics, skillId) {
  const points = metrics
    .filter((m) => m.type === 'skill' && m.refId === skillId)
    .sort((a, b) => getRecordedAt(a) - getRecordedAt(b))

  if (points.length === 0) return { direction: 'stable', delta: 0, points: [] }
  if (points.length === 1) {
    return { direction: 'stable', delta: 0, points }
  }

  const last = points[points.length - 1]
  const prev = points[points.length - 2]
  const delta = last.value - prev.value

  return {
    direction: delta > 0 ? 'improving' : delta < 0 ? 'declining' : 'stable',
    delta,
    points,
  }
}

export function getAllSkillTrends(metrics, skills) {
  return skills.map((s) => ({
    skill: s,
    ...getSkillTrend(metrics, s.id),
  }))
}

export function getSkillChartSeries(metrics, skills, days = 30) {
  const cutoff = subDays(new Date(), days)
  const skillMetrics = metrics.filter(
    (m) => m.type === 'skill' && getRecordedAt(m) >= cutoff
  )

  const dateMap = new Map()

  skillMetrics.forEach((m) => {
    const d = format(getRecordedAt(m), 'MMM d')
    if (!dateMap.has(d)) dateMap.set(d, { date: d })
    dateMap.get(d)[m.label] = m.value
  })

  return Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  )
}

export function getTasksCompletedSeries(metrics, days = 14) {
  const cutoff = subDays(new Date(), days)
  const counts = {}

  for (let i = days; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'MMM d')
    counts[d] = 0
  }

  metrics
    .filter((m) => m.type === 'task' && getRecordedAt(m) >= cutoff)
    .forEach((m) => {
      const d = format(getRecordedAt(m), 'MMM d')
      if (counts[d] !== undefined) counts[d] += 1
    })

  return Object.entries(counts).map(([date, completed]) => ({ date, completed }))
}

export function getGoalsChartData(goals) {
  return goals.map((g) => ({
    name: g.title?.length > 18 ? `${g.title.slice(0, 18)}…` : g.title,
    progress: g.target ? Math.round(((g.progress ?? 0) / g.target) * 100) : 0,
    full: g.title,
  }))
}

export function getExpenseByCategory(expenses) {
  const map = {}
  expenses.forEach((e) => {
    const cat = e.category || 'Other'
    map[cat] = (map[cat] || 0) + Number(e.amount || 0)
  })
  return Object.entries(map).map(([name, value]) => ({ name, value }))
}

export function getExpenseOverTime(expenses, days = 30) {
  const cutoff = subDays(new Date(), days)
  const map = {}

  for (let i = days; i >= 0; i--) {
    const d = format(subDays(new Date(), i), 'MMM d')
    map[d] = 0
  }

  expenses.forEach((e) => {
    const date = e.date ? parseISO(e.date) : getRecordedAt(e)
    if (!date || date < cutoff) return
    const d = format(date, 'MMM d')
    if (map[d] !== undefined) map[d] += Number(e.amount || 0)
  })

  return Object.entries(map).map(([date, amount]) => ({ date, amount }))
}

export function getMonthlySpending(expenses) {
  const now = new Date()
  return expenses
    .filter((e) => {
      const d = e.date ? parseISO(e.date) : getRecordedAt(e)
      return d && isSameMonth(d, now)
    })
    .reduce((sum, e) => sum + Number(e.amount || 0), 0)
}

export function getTotalSpending(expenses) {
  return expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
}
