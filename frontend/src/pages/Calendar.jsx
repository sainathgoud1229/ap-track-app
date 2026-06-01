import { useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Bell } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { useCollection } from '../hooks/useCollection'
import { useFirestore } from '../hooks/useFirestore'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import { cn } from '../lib/utils'

export default function Calendar() {
  const { user } = useAuth()
  const [current, setCurrent] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', time: '', type: 'reminder' })

  const { docs: reminders } = useCollection(user?.id, 'reminders')
  const { docs: tasks } = useCollection(user?.id, 'tasks')
  const { add, remove } = useFirestore(user?.id)

  const monthStart = startOfMonth(current)
  const monthEnd = endOfMonth(current)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const padStart = monthStart.getDay()
  const padded = [...Array(padStart).fill(null), ...days]

  const getEventsForDay = (day) => {
    if (!day) return []
    const dayStr = format(day, 'yyyy-MM-dd')
    const rems = reminders.filter((r) => r.date === dayStr)
    const taskEvents = tasks.filter((t) => t.dueDate === dayStr)
    return [...rems.map((r) => ({ ...r, kind: 'reminder' })), ...taskEvents.map((t) => ({ ...t, kind: 'task' }))]
  }

  const selectedEvents = getEventsForDay(selectedDay)

  const handleAddReminder = async (e) => {
    e.preventDefault()
    await add('reminders', form, `Reminder: ${form.title}`)
    toast.success('Reminder added')
    setModalOpen(false)
    setForm({ title: '', date: format(selectedDay, 'yyyy-MM-dd'), time: '', type: 'reminder' })
  }

  const upcomingTasks = tasks
    .filter((t) => t.dueDate && t.status !== 'done')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5)

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2" hover={false}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{format(current, 'MMMM yyyy')}</h2>
          <div className="flex gap-1">
            <button onClick={() => setCurrent(subMonths(current, 1))} className="rounded-lg p-2 hover:bg-white/5"><ChevronLeft size={18} /></button>
            <button onClick={() => setCurrent(new Date())} className="rounded-lg px-3 py-2 text-sm hover:bg-white/5">Today</button>
            <button onClick={() => setCurrent(addMonths(current, 1))} className="rounded-lg p-2 hover:bg-white/5"><ChevronRight size={18} /></button>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs text-zinc-500">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {padded.map((day, i) => {
            if (!day) return <div key={`pad-${i}`} />
            const events = getEventsForDay(day)
            const selected = isSameDay(day, selectedDay)
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  'relative aspect-square rounded-lg p-1 text-sm transition',
                  !isSameMonth(day, current) && 'text-zinc-600',
                  isToday(day) && 'ring-1 ring-indigo-500/50',
                  selected ? 'bg-indigo-500/20 text-indigo-200' : 'hover:bg-white/5 text-zinc-300'
                )}
              >
                {format(day, 'd')}
                {events.length > 0 && (
                  <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-400" />
                )}
              </button>
            )
          })}
        </div>
      </Card>

      <div className="space-y-4">
        <Card hover={false}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-white">{format(selectedDay, 'MMM d, yyyy')}</h3>
            <Button size="sm" onClick={() => { setForm({ title: '', date: format(selectedDay, 'yyyy-MM-dd'), time: '', type: 'reminder' }); setModalOpen(true) }}>
              <Plus size={14} />
            </Button>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-zinc-500">No events</p>
          ) : (
            <ul className="space-y-2">
              {selectedEvents.map((e) => (
                <li key={e.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Bell size={14} className="text-indigo-400" />
                    <span>{e.title}</span>
                  </div>
                  {e.kind === 'reminder' && (
                    <button onClick={() => remove('reminders', e.id).then(() => toast.success('Removed'))} className="text-xs text-zinc-500 hover:text-rose-400">×</button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card hover={false}>
          <h3 className="mb-3 font-semibold text-white">Upcoming deadlines</h3>
          <ul className="space-y-2">
            {upcomingTasks.map((t) => (
              <li key={t.id} className="text-sm text-zinc-400">
                <span className="text-zinc-200">{t.title}</span>
                <span className="ml-2 text-xs text-indigo-400">{t.dueDate}</span>
              </li>
            ))}
            {upcomingTasks.length === 0 && <p className="text-sm text-zinc-500">No upcoming tasks</p>}
          </ul>
        </Card>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Reminder">
        <form onSubmit={handleAddReminder} className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Time" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </Modal>
    </div>
  )
}
