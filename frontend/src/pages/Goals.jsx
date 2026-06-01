import { useState } from 'react'
import { Plus, Target, Trash2, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { useCollection } from '../hooks/useCollection'
import { useFirestore } from '../hooks/useFirestore'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import ProgressBar from '../components/ui/ProgressBar'
import EmptyState from '../components/ui/EmptyState'
import { CardSkeleton } from '../components/ui/Skeleton'
import { calcProgress } from '../lib/utils'
import ChartCard from '../components/charts/ChartCard'
import GoalsProgressChart from '../components/charts/GoalsProgressChart'
import { getGoalsChartData } from '../lib/metrics'

export default function Goals() {
  const { user } = useAuth()
  const { docs: goals, loading } = useCollection(user?.uid, 'goals')
  const { add, update, remove, logMetric } = useFirestore(user?.uid)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', progress: 0, target: 100, unit: '%' })

  const openNew = () => {
    setEditing(null)
    setForm({ title: '', progress: 0, target: 100, unit: '%' })
    setModalOpen(true)
  }

  const openEdit = (g) => {
    setEditing(g)
    setForm({ title: g.title, progress: g.progress ?? 0, target: g.target ?? 100, unit: g.unit || '%' })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const data = { ...form, progress: Number(form.progress), target: Number(form.target) }
    try {
      if (editing) {
        await update('goals', editing.id, data, `Updated goal: ${data.title}`)
      } else {
        await add('goals', data, `Created goal: ${data.title}`)
      }
      toast.success(editing ? 'Goal updated' : 'Goal created')
      setModalOpen(false)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const increment = async (g, amount = 1) => {
    const prev = g.progress ?? 0
    const progress = Math.min(g.target, prev + amount)
    await update('goals', g.id, { progress }, `Progress on: ${g.title}`)
    await logMetric({
      type: 'goal',
      refId: g.id,
      label: g.title,
      value: progress,
      previousValue: prev,
      meta: { target: g.target },
    })
    if (progress >= g.target) toast.success('Goal completed!')
  }

  return (
    <div className="space-y-6">
      <ChartCard title="Goals overview" subtitle="Progress updates are tracked on your dashboard">
        <GoalsProgressChart data={getGoalsChartData(goals)} />
      </ChartCard>

      <div className="flex justify-end">
        <Button onClick={openNew}><Plus size={16} /> Add Goal</Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">{[1, 2].map((i) => <CardSkeleton key={i} />)}</div>
      ) : goals.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" action={<Button onClick={openNew}>Add Goal</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => (
            <Card key={g.id}>
              <div className="mb-3 flex items-start justify-between">
                <h3 className="font-medium text-white">{g.title}</h3>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(g)} className="text-zinc-500 hover:text-indigo-400"><Pencil size={16} /></button>
                  <button onClick={() => remove('goals', g.id, 'Deleted a goal').then(() => toast.success('Deleted'))} className="text-zinc-500 hover:text-rose-400"><Trash2 size={16} /></button>
                </div>
              </div>
              <ProgressBar value={calcProgress(g.progress, g.target)} />
              <div className="mt-2 flex items-center justify-between text-sm text-zinc-400">
                <span>{g.progress ?? 0} / {g.target} {g.unit}</span>
                <span>{calcProgress(g.progress, g.target)}%</span>
              </div>
              <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => increment(g)}>
                +1 progress
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Goal' : 'New Goal'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Progress" type="number" value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} />
            <Input label="Target" type="number" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
          </div>
          <Input label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="%, books, hours..." />
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </Modal>
    </div>
  )
}
