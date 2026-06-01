import { useRef, useState } from 'react'
import { Plus, Pin, Search, Trash2, StickyNote } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { useCollection } from '../hooks/useCollection'
import { useFirestore } from '../hooks/useFirestore'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import { cn } from '../lib/utils'

export default function Notes() {
  const { user } = useAuth()
  const { docs: notes } = useCollection(user?.uid, 'notes')
  const { add, update, remove } = useFirestore(user?.uid)
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [title, setTitle] = useState('')
  const editorRef = useRef(null)
  const saveTimer = useRef(null)

  const filtered = notes
    .filter((n) => !search || n.title?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

  const selectNote = (n) => {
    setSelected(n)
    setTitle(n.title || '')
    requestAnimationFrame(() => {
      if (editorRef.current) editorRef.current.innerHTML = n.content || ''
    })
  }

  const autoSave = () => {
    if (!selected) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const content = editorRef.current?.innerHTML || ''
      await update('notes', selected.id, { title, content }, null)
    }, 800)
  }

  const createNote = async () => {
    const id = await add('notes', { title: 'Untitled', content: '<p></p>', pinned: false }, 'Created a note')
    const note = { id, title: 'Untitled', content: '<p></p>', pinned: false }
    setSelected(note)
    toast.success('Note created')
  }

  const togglePin = async (note) => {
    await update('notes', note.id, { pinned: !note.pinned }, note.pinned ? 'Unpinned note' : 'Pinned note')
    toast.success(note.pinned ? 'Unpinned' : 'Pinned')
  }

  const execCmd = (cmd) => {
    document.execCommand(cmd, false, null)
    editorRef.current?.focus()
    autoSave()
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 md:flex-row">
      <div className="flex w-full flex-col md:w-72">
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500/50"
          />
        </div>
        <Button onClick={createNote} className="mb-3 w-full"><Plus size={16} /> New Note</Button>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 py-8">No notes</p>
          ) : (
            filtered.map((n) => (
              <button
                key={n.id}
                onClick={() => selectNote(n)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition',
                  selected?.id === n.id ? 'bg-indigo-500/15 text-indigo-200' : 'hover:bg-white/5 text-zinc-300'
                )}
              >
                {n.pinned && <Pin size={12} className="text-amber-400 shrink-0" />}
                <span className="truncate">{n.title}</span>
              </button>
            ))
          )}
        </div>
      </div>

      <Card className="flex flex-1 flex-col" hover={false}>
        {!selected ? (
          <EmptyState icon={StickyNote} title="Select or create a note" action={<Button onClick={createNote}>New Note</Button>} />
        ) : (
          <>
            <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-3">
              <Input
                value={title}
                onChange={(e) => { setTitle(e.target.value); autoSave() }}
                className="flex-1 border-0 bg-transparent text-lg font-semibold"
                placeholder="Note title"
              />
              <button onClick={() => togglePin(selected)} className={cn('p-2 rounded-lg', selected.pinned ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-500 hover:bg-white/5')}>
                <Pin size={18} />
              </button>
              <button
                onClick={() => { remove('notes', selected.id); setSelected(null); toast.success('Deleted') }}
                className="p-2 text-zinc-500 hover:text-rose-400"
              >
                <Trash2 size={18} />
              </button>
            </div>
            <div className="mb-2 flex gap-1 border-b border-white/5 pb-2">
              {['bold', 'italic', 'insertUnorderedList'].map((cmd) => (
                <button
                  key={cmd}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => execCmd(cmd)}
                  className="rounded px-2 py-1 text-xs text-zinc-400 hover:bg-white/5 hover:text-white capitalize"
                >
                  {cmd === 'insertUnorderedList' ? 'List' : cmd}
                </button>
              ))}
            </div>
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={autoSave}
              className="prose-note flex-1 overflow-y-auto outline-none text-zinc-300 min-h-[200px]"
            />
            <p className="mt-2 text-xs text-zinc-600">Auto-saves as you type</p>
          </>
        )}
      </Card>
    </div>
  )
}
