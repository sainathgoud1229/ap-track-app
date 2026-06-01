import { Flame, CheckCircle, LogIn, Activity as ActivityIcon } from 'lucide-react'
import { format } from 'date-fns'
import { toDate } from '../lib/utils'
import { useDocument } from '../hooks/useDocument'
import { useAuth } from '../hooks/useAuth'
import { useCollection } from '../hooks/useCollection'
import Card from '../components/ui/Card'
import { CardSkeleton } from '../components/ui/Skeleton'

const typeIcons = {
  tasks: CheckCircle,
  auth: LogIn,
  goals: Flame,
  skills: Flame,
  default: ActivityIcon,
}

export default function Activity() {
  const { user } = useAuth()
  const { docs: activities, loading } = useCollection(user?.id, 'activities')
  const { data: profile } = useDocument(user?.id ? ['users', user.id] : null)

  const completedTasks = activities.filter((a) => a.message?.startsWith('Completed')).length
  const logins = activities.filter((a) => a.type === 'auth').length
  const streak = profile?.streak ?? 1

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">{[1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-zinc-500">Productivity streak</p>
          <p className="text-3xl font-bold text-amber-400">{streak} days</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Tasks completed</p>
          <p className="text-3xl font-bold text-emerald-400">{completedTasks}</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Login sessions</p>
          <p className="text-3xl font-bold text-indigo-400">{logins}</p>
        </Card>
      </div>

      <Card hover={false}>
        <h2 className="mb-4 font-semibold text-white">Work history</h2>
        <div className="space-y-3">
          {activities.length === 0 && <p className="text-sm text-zinc-500">No activity yet</p>}
          {activities.map((a) => {
            const Icon = typeIcons[a.type] || typeIcons.default
            return (
              <div key={a.id} className="flex items-start gap-3 rounded-lg bg-white/5 px-4 py-3">
                <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                  <Icon size={16} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-zinc-200">{a.message}</p>
                  <p className="text-xs capitalize text-zinc-500">{a.type}</p>
                </div>
                {toDate(a.createdAt) && (
                  <span className="text-xs text-zinc-600 shrink-0">
                    {format(toDate(a.createdAt), 'MMM d, h:mm a')}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
