import { useState } from 'react'
import { Plus, Trash2, Pencil, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import { useAuth } from '../hooks/useAuth'
import { useCollection } from '../hooks/useCollection'
import { useFirestore } from '../hooks/useFirestore'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import ChartCard from '../components/charts/ChartCard'
import SpendingChart from '../components/charts/SpendingChart'
import CategoryPieChart from '../components/charts/CategoryPieChart'
import EmptyState from '../components/ui/EmptyState'
import { CardSkeleton } from '../components/ui/Skeleton'
import { EXPENSE_CATEGORIES, formatMoney, CURRENCY_SYMBOL } from '../lib/utils'
import { getExpenseByCategory, getExpenseOverTime, getMonthlySpending, getTotalSpending } from '../lib/metrics'

export default function Finance() {
  const { user } = useAuth()
  const { docs: expenses, loading } = useCollection(user?.id, 'expenses', 'date')
  const { add, update, remove, logMetric } = useFirestore(user?.id)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: 'Food & Groceries',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  })

  const monthly = getMonthlySpending(expenses)
  const total = getTotalSpending(expenses)
  const byCategory = getExpenseByCategory(expenses)
  const overTime = getExpenseOverTime(expenses)

  const openNew = () => {
    setEditing(null)
    setForm({
      title: '',
      amount: '',
      category: 'Food & Groceries',
      date: new Date().toISOString().slice(0, 10),
      note: '',
    })
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const data = {
      title: form.title,
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
      note: form.note,
    }
    try {
      if (editing) {
        await update('expenses', editing.id, data, `Updated expense: ${data.title}`)
      } else {
        const id = await add('expenses', data, `Spent ${formatMoney(data.amount)} on ${data.title}`)
        await logMetric({
          type: 'expense',
          refId: id,
          label: data.title,
          value: data.amount,
          meta: { category: data.category, date: data.date },
        })
      }
      toast.success(editing ? 'Expense updated' : 'Expense logged')
      setModalOpen(false)
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        All amounts in <span className="font-medium text-amber-400">Indian Rupees ({CURRENCY_SYMBOL})</span> — track daily spending and see charts on your dashboard.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-zinc-500">This month (₹)</p>
          <p className="text-2xl font-bold text-amber-400">{formatMoney(monthly)}</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">All time (₹)</p>
          <p className="text-2xl font-bold text-white">{formatMoney(total)}</p>
        </Card>
        <Card>
          <p className="text-xs text-zinc-500">Transactions</p>
          <p className="text-2xl font-bold text-white">{expenses.length}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Spending over time" subtitle="Daily totals in ₹ — last 30 days">
          <SpendingChart data={overTime} />
        </ChartCard>
        <ChartCard title="By category" subtitle="Where your money goes">
          <CategoryPieChart data={byCategory} />
        </ChartCard>
      </div>

      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus size={16} /> Add expense
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <CardSkeleton key={i} />)}</div>
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No expenses tracked"
          description="Log every purchase to see spending graphs on your dashboard."
          action={<Button onClick={openNew}>Add expense</Button>}
        />
      ) : (
        <div className="space-y-2">
          {expenses.map((ex) => (
            <Card key={ex.id} className="flex items-center gap-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 text-xs font-bold">
                {ex.category?.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white">{ex.title}</p>
                <p className="text-xs text-zinc-500">
                  {ex.category}
                  {ex.date && ` · ${format(parseISO(ex.date), 'MMM d, yyyy')}`}
                </p>
              </div>
              <p className="text-lg font-semibold text-rose-300">-{formatMoney(ex.amount)}</p>
              <button
                onClick={() => {
                  setEditing(ex)
                  setForm({
                    title: ex.title,
                    amount: String(ex.amount),
                    category: ex.category,
                    date: ex.date,
                    note: ex.note || '',
                  })
                  setModalOpen(true)
                }}
                className="text-zinc-500 hover:text-indigo-400"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => remove('expenses', ex.id).then(() => toast.success('Deleted'))}
                className="text-zinc-500 hover:text-rose-400"
              >
                <Trash2 size={16} />
              </button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit expense' : 'Log expense'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="What did you spend on?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input label="Amount (₹)" type="number" min="0" step="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <label className="block text-sm text-zinc-400">
            Category
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Input label="Note (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <Button type="submit" className="w-full">Save</Button>
        </form>
      </Modal>
    </div>
  )
}
