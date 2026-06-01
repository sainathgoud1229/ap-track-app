import { Link } from 'react-router-dom'
import {
  Sparkles,
  Plus,
  TrendingUp,
  Wallet,
  ArrowRight,
  Target,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react'
import { format, isToday, parseISO } from 'date-fns'
import { useDashboard } from '../hooks/useDashboard'
import { useAuth } from '../hooks/useAuth'
import Card from '../components/ui/Card'
import TrendBadge from '../components/ui/TrendBadge'
import { CardSkeleton } from '../components/ui/Skeleton'
import ChartCard from '../components/charts/ChartCard'
import SkillsTrendChart from '../components/charts/SkillsTrendChart'
import SpendingChart from '../components/charts/SpendingChart'
import CategoryPieChart from '../components/charts/CategoryPieChart'
import TasksActivityChart from '../components/charts/TasksActivityChart'
import GoalsProgressChart from '../components/charts/GoalsProgressChart'
import { toDate, formatMoney, getDisplayName } from '../lib/utils'
import { getGreeting, HOME_FOCUS_TASKS, HOME_TIPS } from '../lib/homeContent'
import Button from '../components/ui/Button'

export default function Dashboard() {
  const { user } = useAuth()
  const {
    tasks,
    goals,
    activities,
    loading,
    skillTrends,
    skillChartData,
    skillNames,
    tasksChart,
    goalsChart,
    spendingChart,
    categoryChart,
    monthlySpend,
    improvingCount,
    decliningCount,
    doneCount,
    completionRate,
  } = useDashboard()

  const displayName = getDisplayName(user)
  const hasTasks = tasks.length > 0

  const todayTasks = tasks.filter((t) => {
    if (!t.dueDate) return t.status !== 'done'
    try {
      return isToday(parseISO(t.dueDate)) || t.status !== 'done'
    } catch {
      return t.status !== 'done'
    }
  }).slice(0, 5)

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/5">
        <p className="text-sm text-indigo-300">{getGreeting()},</p>
        <h1 className="text-2xl font-bold text-white md:text-3xl">{displayName}</h1>
        <p className="mt-2 max-w-xl text-sm text-zinc-400">
          Your command center — tasks, goals, skills, and spending in ₹. Start with today&apos;s focus below or open Finance to log expenses.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/tasks">
            <Button>
              <Plus size={16} /> Add task
            </Button>
          </Link>
          <Link to="/finance">
            <Button variant="secondary">
              <Wallet size={16} /> Log expense (₹)
            </Button>
          </Link>
          <Link to="/goals">
            <Button variant="secondary">
              <Target size={16} /> Goals
            </Button>
          </Link>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <p className="text-xs text-zinc-500">Tasks done</p>
          <p className="text-2xl font-bold text-white">
            {doneCount}/{tasks.length || '—'}
          </p>
          <p className="text-xs text-indigo-400">
            {tasks.length ? `${completionRate}% complete` : 'Add tasks to track'}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Skills improving</p>
          <p className="text-2xl font-bold text-emerald-400">{improvingCount}</p>
          <p className="text-xs text-zinc-500">{decliningCount} declining</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Active goals</p>
          <p className="text-2xl font-bold text-violet-400">{goals.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Spent this month (₹)</p>
          <p className="text-2xl font-bold text-amber-400">{formatMoney(monthlySpend)}</p>
          <Link to="/finance" className="text-xs text-indigo-400 hover:text-indigo-300">
            View finance →
          </Link>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">AI assistant</p>
          <p className="text-sm font-medium text-zinc-200">Chat bottom-right</p>
          <p className="text-xs text-zinc-500">Ask anything — like ChatGPT</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">
              {hasTasks ? "Today's tasks" : "Today's focus — get started"}
            </h2>
            <Link to="/tasks" className="text-sm text-indigo-400">
              {hasTasks ? 'View all' : 'Create tasks'}
            </Link>
          </div>
          <ul className="space-y-2">
            {hasTasks ? (
              todayTasks.length === 0 ? (
                <p className="text-sm text-zinc-500">No tasks due today. Check Tasks for your full list.</p>
              ) : (
                todayTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
                    <span
                      className={`h-2 w-2 rounded-full ${t.status === 'done' ? 'bg-emerald-400' : 'bg-indigo-400'}`}
                    />
                    <span className={t.status === 'done' ? 'line-through text-zinc-500' : 'text-zinc-200'}>
                      {t.title}
                    </span>
                    {t.tag && (
                      <span className="ml-auto text-[10px] text-zinc-500">{t.tag}</span>
                    )}
                  </li>
                ))
              )
            ) : (
              HOME_FOCUS_TASKS.map((item) => {
                const Icon = item.icon
                return (
                  <li
                    key={item.title}
                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 px-3 py-2.5"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-zinc-200">{item.title}</p>
                      <p className="text-[10px] text-zinc-500">{item.tag}</p>
                    </div>
                    <CheckCircle2 size={16} className="shrink-0 text-zinc-600" />
                  </li>
                )
              })
            )}
          </ul>
          {!hasTasks && (
            <p className="mt-3 text-xs text-zinc-500">
              Tip: go to <Link to="/tasks" className="text-indigo-400">Tasks</Link> and add your own — they will show here automatically.
            </p>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb size={16} className="text-amber-400" />
            <h2 className="font-semibold text-white">Productivity tips</h2>
          </div>
          <ul className="space-y-2">
            {HOME_TIPS.map((tip) => (
              <li key={tip} className="text-sm text-zinc-400 leading-snug">
                • {tip}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Skills progress"
          subtitle="Level over time"
          action={
            <Link to="/skills" className="text-xs text-indigo-400 hover:text-indigo-300">
              Manage
            </Link>
          }
        >
          <SkillsTrendChart data={skillChartData} skillNames={skillNames} />
        </ChartCard>
        <ChartCard
          title="Spending (₹)"
          subtitle="Daily expenses — last 30 days"
          action={
            <Link to="/finance" className="text-xs text-indigo-400 hover:text-indigo-300">
              Add expense
            </Link>
          }
        >
          <SpendingChart data={spendingChart} />
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Tasks completed" subtitle="Per day — last 14 days">
          <TasksActivityChart data={tasksChart} />
        </ChartCard>
        <ChartCard title="Goals" subtitle="Progress %">
          <GoalsProgressChart data={goalsChart} />
        </ChartCard>
        <ChartCard title="Spending by category (₹)">
          <CategoryPieChart data={categoryChart} />
        </ChartCard>
      </div>

      {skillTrends.length > 0 && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Skill trends</h2>
            <Link to="/skills" className="flex items-center gap-1 text-sm text-indigo-400">
              All skills <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {skillTrends.map(({ skill, direction, delta, points }) => (
              <div
                key={skill.id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">{skill.name}</p>
                  <p className="text-sm text-zinc-500">{skill.level}% now</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <TrendBadge direction={direction} delta={delta} />
                  {points.length >= 2 && (
                    <span className="text-[10px] text-zinc-600">{points.length} updates</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-semibold text-white">Quick actions</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link to="/tasks">
              <Button variant="secondary" className="w-full justify-start">
                <Plus size={16} /> New task
              </Button>
            </Link>
            <Link to="/finance">
              <Button variant="secondary" className="w-full justify-start">
                <Wallet size={16} /> Log expense (₹)
              </Button>
            </Link>
            <Link to="/skills">
              <Button variant="secondary" className="w-full justify-start">
                <TrendingUp size={16} /> Update skill
              </Button>
            </Link>
            <Link to="/goals">
              <Button variant="secondary" className="w-full justify-start">
                <Target size={16} /> New goal
              </Button>
            </Link>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-white">Recent activity</h2>
          <ul className="space-y-2">
            {activities.length === 0 ? (
              <p className="text-sm text-zinc-500">Activity appears when you add tasks, expenses, or skills.</p>
            ) : (
              activities.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-center gap-3 text-sm">
                  <Sparkles size={14} className="shrink-0 text-indigo-400" />
                  <span className="min-w-0 truncate text-zinc-300">{a.message}</span>
                  {toDate(a.createdAt) && (
                    <span className="ml-auto shrink-0 text-xs text-zinc-600">
                      {format(toDate(a.createdAt), 'MMM d')}
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
          <Link to="/activity" className="mt-3 inline-block text-xs text-indigo-400">
            View all activity →
          </Link>
        </Card>
      </div>
    </div>
  )
}
