import { useState } from 'react'
import { Plus, Trophy, Trash2, Pencil, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { useAuth } from '../hooks/useAuth'
import { useCollection } from '../hooks/useCollection'
import { useFirestore } from '../hooks/useFirestore'
import { supabase } from '../supabase/config'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import Input from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import { CardSkeleton } from '../components/ui/Skeleton'

export default function Achievements() {
  const { user } = useAuth()
  const { docs: items, loading } = useCollection(user?.id, 'achievements')
  const { add, update, remove } = useFirestore(user?.id)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', date: new Date().toISOString().slice(0, 10) })
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const uploadFile = async (f) => {
    const path = `${user.id}/achievements/${Date.now()}_${f.name}`
    const { error } = await supabase.storage.from('uploads').upload(path, f)
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path)
    return { url: publicUrl, path }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setUploading(true)
    try {
      let imageUrl = editing?.imageUrl
      let imagePath = editing?.imagePath
      
      if (file) {
        const result = await uploadFile(file)
        imageUrl = result.url
        imagePath = result.path
      }

      const data = { ...form, imageUrl: imageUrl || null, imagePath: imagePath || null }
      if (editing) {
        await update('achievements', editing.id, data, `Updated achievement: ${form.title}`)
      } else {
        await add('achievements', data, `Added achievement: ${form.title}`)
      }
      toast.success('Saved')
      setModalOpen(false)
      setFile(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (item) => {
    if (!confirm('Delete this achievement?')) return
    if (item.imagePath && supabase) {
      try {
        await supabase.storage.from('uploads').remove([item.imagePath])
      } catch { /* ignore */ }
    }
    await remove('achievements', item.id, 'Deleted achievement')
    toast.success('Deleted')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(null); setForm({ title: '', description: '', date: new Date().toISOString().slice(0, 10) }); setModalOpen(true) }}>
          <Plus size={16} /> Add Achievement
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2].map((i) => <CardSkeleton key={i} />)}</div>
      ) : items.length === 0 ? (
        <EmptyState icon={Trophy} title="No achievements yet" action={<Button onClick={() => setModalOpen(true)}>Add one</Button>} />
      ) : (
        <div className="relative border-l border-indigo-500/30 pl-8 space-y-8 ml-4">
          {items.map((item) => (
            <div key={item.id} className="relative">
              <div className="absolute -left-[41px] top-1 h-3 w-3 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />
              <div className="glass rounded-xl p-5">
                <div className="flex gap-4">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt="" className="h-20 w-20 rounded-lg object-cover" />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-semibold text-white">{item.title}</h3>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditing(item); setForm({ title: item.title, description: item.description || '', date: item.date || '' }); setModalOpen(true) }} className="text-zinc-500 hover:text-indigo-400"><Pencil size={16} /></button>
                        <button onClick={() => handleDelete(item)} className="text-zinc-500 hover:text-rose-400"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    {item.date && <p className="text-xs text-indigo-400">{format(new Date(item.date), 'MMMM d, yyyy')}</p>}
                    {item.description && <p className="mt-2 text-sm text-zinc-400">{item.description}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit' : 'New Achievement'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <label className="block text-sm text-zinc-400">
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100"
              rows={3}
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/20 px-4 py-6 text-sm text-zinc-400 hover:border-indigo-500/50">
            <Upload size={18} />
            {file ? file.name : 'Upload certificate / image'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0])} />
          </label>
          <Button type="submit" className="w-full" disabled={uploading}>{uploading ? 'Uploading...' : 'Save'}</Button>
        </form>
      </Modal>
    </div>
  )
}
