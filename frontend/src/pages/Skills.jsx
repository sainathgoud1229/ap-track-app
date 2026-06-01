import { useState } from 'react'
import { Plus, Sparkles, Trash2, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { useCollection } from '../hooks/useCollection'
import { useFirestore } from '../hooks/useFirestore'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import ProgressBar from '../components/ui/ProgressBar'
import TrendBadge from '../components/ui/TrendBadge'
import EmptyState from '../components/ui/EmptyState'
import ChartCard from '../components/charts/ChartCard'
import SkillsTrendChart from '../components/charts/SkillsTrendChart'
import SkillSparkline from '../components/charts/SkillSparkline'
import { CardSkeleton } from '../components/ui/Skeleton'
import { getAllSkillTrends, getSkillChartSeries } from '../lib/metrics'

export default function Skills() {
  const { user } = useAuth()
  const { docs: skills, loading } = useCollection(user?.id, 'skills')
  const { docs: metrics } = useCollection(user?.id, 'metrics', 'recordedAt')
  const { add, update, remove, logMetric } = useFirestore(user?.id)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', level: 50, category: '' })

  const skillTrends = getAllSkillTrends(metrics, skills)
  const chartData = getSkillChartSeries(metrics, skills)
  const skillNames = skills.map((s) => s.name)

  const handleSave = async (e) => {
    e.preventDefault()
    const data = { ...form, level: Number(form.level) }
    try {
      if (editing) {
        const prevLevel = editing.level ?? 0
        await update('skills', editing.id, data, `Updated skill: ${data.name}`)
        if (data.level !== prevLevel) {
          await logMetric({
            type: 'skill',
            refId: editing.id,
            label: data.name,
            value: data.level,
            previousValue: prevLevel,
          })
          const dir = data.level > prevLevel ? 'improved' : data.level < prevLevel ? 'declined' : 'unchanged'
          toast.success(`Skill ${dir} (${prevLevel}% → ${data.level}%)`)
        } else {
          toast.success('Saved')
        }
      } else {
        const id = await add('skills', data, `Added skill: ${data.name}`)
        await logMetric({
          type: 'skill',
          refId: id,
          label: data.name,
          value: data.level,
          previousValue: null,
        })
        toast.success('Skill added — trend tracking started')
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const quickBump = async (skill, amount) => {
    const prev = skill.level ?? 0
    const next = Math.min(100, Math.max(0, prev + amount))
    await update('skills', skill.id, { level: next }, `Updated ${skill.name}`)
    await logMetric({
      type: 'skill',
      refId: skill.id,
      label: skill.name,
      value: next,
      previousValue: prev,
    })
    toast.success(`${skill.name}: ${prev}% → ${next}%`)
  }

  const avgLevel = skills.length
    ? Math.round(skills.reduce((a, s) => a + (s.level ?? 0), 0) / skills.length)
    : 0

  const improving = skillTrends.filter((t) => t.direction === 'improving').length

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-zinc-500">Average level</p>
          <p className="text-3xl font-bold text-white">{avgLevel}%</p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">Improving</p>
          <p className="text-3xl font-bold text-emerald-400">{improving}</p>
        </Card>
        <Card>
          <p className="text-sm text-zinc-500">Total skills</p>
          <p className="text-3xl font-bold text-violet-400">{skills.length}</p>
        </Card>
      </div>

      <ChartCard title="Progress over time" subtitle="Each update is logged — bump levels to see trends">
        <SkillsTrendChart data={chartData} skillNames={skillNames} />
      </ChartCard>

      <div className="flex justify-end">
        <Button
          onClick={() => {
            setEditing(null)
            setForm({ name: '', level: 50, category: '' })
            setModalOpen(true)
          }}
        >
          <Plus size={16} /> Add Skill
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : skills.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No skills tracked"
          action={
            <Button onClick={() => setModalOpen(true)}>Add Skill</Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {skillTrends.map(({ skill, direction, delta, points }) => (
            <Card key={skill.id}>
              <div className="mb-2 flex justify-between gap-2">
                <div>
                  <h3 className="font-medium text-white">{skill.name}</h3>
                  {skill.category && <p className="text-xs text-zinc-500">{skill.category}</p>}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <TrendBadge direction={direction} delta={delta} />
                  <SkillSparkline points={points} improving={direction} />
                </div>
              </div>
              <ProgressBar value={skill.level} color="violet" />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-zinc-500">{skill.level}%</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => quickBump(skill, 5)}>
                    +5
                  </Button>
                  <button
                    onClick={() => {
                      setEditing(skill)
                      setForm({ name: skill.name, level: skill.level, category: skill.category || '' })
                      setModalOpen(true)
                    }}
                    className="rounded-lg p-2 text-zinc-500 hover:text-indigo-400"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => remove('skills', skill.id).then(() => toast.success('Deleted'))}
                    className="rounded-lg p-2 text-zinc-500 hover:text-rose-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Skill' : 'New Skill'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <label className="block text-sm text-zinc-400">
            Level: {form.level}%
            <input
              type="range"
              min="0"
              max="100"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
              className="mt-2 w-full accent-indigo-500"
            />
          </label>
          <p className="text-xs text-zinc-500">Saving logs a data point for your progress charts.</p>
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </Modal>
    </div>
  )
}
