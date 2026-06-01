import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, Trash2, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { useCollection } from '../hooks/useCollection'
import { useFirestore } from '../hooks/useFirestore'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import { CardSkeleton } from '../components/ui/Skeleton'
import { TASK_STATUSES, TASK_STATUS_LABELS, formatDate, isOverdue, cn } from '../lib/utils'
import { CheckSquare } from 'lucide-react'

function SortableTask({ task, onEdit, onDelete, onStatusChange }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="glass flex items-center gap-3 rounded-xl px-4 py-3">
      <button {...attributes} {...listeners} className="cursor-grab text-zinc-600 hover:text-zinc-400">
        <GripVertical size={16} />
      </button>
      <select
        value={task.status}
        onChange={(e) => onStatusChange(task.id, e.target.value)}
        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-300"
      >
        {TASK_STATUSES.map((s) => (
          <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>
        ))}
      </select>
      <div className="flex-1 min-w-0">
        <p className={cn('truncate text-sm', task.status === 'done' && 'line-through text-zinc-500')}>
          {task.title}
        </p>
        <div className="flex gap-2 text-xs text-zinc-500">
          {task.tag && <span>{task.tag}</span>}
          {task.dueDate && (
            <span className={isOverdue(task.dueDate) && task.status !== 'done' ? 'text-rose-400' : ''}>
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>
      <button onClick={() => onEdit(task)} className="text-zinc-500 hover:text-indigo-400"><Pencil size={16} /></button>
      <button onClick={() => onDelete(task.id)} className="text-zinc-500 hover:text-rose-400"><Trash2 size={16} /></button>
    </div>
  )
}

export default function Tasks() {
  const { user } = useAuth()
  const { docs: tasks, loading } = useCollection(user?.uid, 'tasks')
  const { add, update, remove, logMetric } = useFirestore(user?.uid)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', status: 'todo', tag: '', dueDate: '' })

  const sorted = [...tasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const openNew = () => {
    setEditing(null)
    setForm({ title: '', status: 'todo', tag: '', dueDate: '' })
    setModalOpen(true)
  }

  const openEdit = (task) => {
    setEditing(task)
    setForm({ title: task.title, status: task.status, tag: task.tag || '', dueDate: task.dueDate || '' })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await update('tasks', editing.id, form, `Updated task: ${form.title}`)
        toast.success('Task updated')
      } else {
        await add('tasks', { ...form, order: tasks.length }, `Created task: ${form.title}`)
        toast.success('Task created')
      }
      setModalOpen(false)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sorted.findIndex((t) => t.id === active.id)
    const newIndex = sorted.findIndex((t) => t.id === over.id)
    const reordered = arrayMove(sorted, oldIndex, newIndex)

    await Promise.all(
      reordered.map((t, i) => update('tasks', t.id, { order: i }, null))
    )
  }

  const handleStatusChange = async (id, status) => {
    const task = tasks.find((t) => t.id === id)
    await update('tasks', id, { status }, status === 'done' ? `Completed: ${task?.title}` : null)
    if (status === 'done' && task?.status !== 'done') {
      await logMetric({
        type: 'task',
        refId: id,
        label: task.title,
        value: 1,
        meta: { action: 'completed' },
      })
      toast.success('Task completed!')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return
    await remove('tasks', id, 'Deleted a task')
    toast.success('Task deleted')
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}><Plus size={16} /> Add Task</Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>
      ) : sorted.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No tasks yet" description="Create your first task to stay organized." action={<Button onClick={openNew}>Add Task</Button>} />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sorted.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sorted.map((task) => (
                <SortableTask
                  key={task.id}
                  task={task}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Task' : 'New Task'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input label="Tag" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="e.g. Work, Health" />
          <Input label="Due date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <label className="block text-sm text-zinc-400">
            Status
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100"
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </label>
          <Button type="submit" className="w-full">{editing ? 'Save' : 'Create'}</Button>
        </form>
      </Modal>
    </div>
  )
}
