import { useRef, useState } from 'react'
import { Upload, Download, Trash2, File, Sparkles, Globe, Link2 } from 'lucide-react'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
import { useCollection } from '../hooks/useCollection'
import { useFirestore } from '../hooks/useFirestore'
import { useAiStatus } from '../hooks/useAiStatus'
import { storage } from '../firebase/config'
import { summarizeFile, summarizeUrl } from '../lib/ai'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import EmptyState from '../components/ui/EmptyState'
import SummaryModal from '../components/ai/SummaryModal'

export default function Files() {
  const { user } = useAuth()
  const { configured } = useAiStatus()
  const { docs: files, loading } = useCollection(user?.uid, 'files')
  const { add, remove } = useFirestore(user?.uid)
  const [uploading, setUploading] = useState(false)
  const [summarizingId, setSummarizingId] = useState(null)
  const [url, setUrl] = useState('')
  const [fetchingUrl, setFetchingUrl] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [summaryTitle, setSummaryTitle] = useState('')
  const [summaryText, setSummaryText] = useState('')
  const [summarySource, setSummarySource] = useState('')
  const uploadInputRef = useRef(null)
  const summarizeInputRef = useRef(null)

  const showSummary = (title, text, source) => {
    setSummaryTitle(title)
    setSummaryText(text)
    setSummarySource(source)
    setSummaryOpen(true)
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !storage) {
      toast.error('Storage is not configured')
      return
    }

    setUploading(true)
    try {
      const path = `users/${user.uid}/files/${Date.now()}_${file.name}`
      const storageRef = ref(storage, path)
      await uploadBytes(storageRef, file)
      const downloadUrl = await getDownloadURL(storageRef)

      await add(
        'files',
        { name: file.name, url: downloadUrl, path, size: file.size, type: file.type },
        `Uploaded: ${file.name}`
      )

      toast.success('File uploaded')

      if (configured && (file.type.startsWith('text/') || file.type === 'application/pdf' || file.type.startsWith('image/'))) {
        toast('Tip: click Summarize on the file for a full AI breakdown', { icon: '✨' })
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleUploadAndSummarize = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!configured) {
      toast.error('AI not configured — add GEMINI_API_KEY to .env')
      return
    }

    setSummarizingId('upload')
    try {
      toast.loading('Analyzing file…', { id: 'sum' })
      const summary = await summarizeFile(file)
      showSummary(`Summary: ${file.name}`, summary, file.name)
      toast.success('Summary ready', { id: 'sum' })

      if (storage && user) {
        const path = `users/${user.uid}/files/${Date.now()}_${file.name}`
        const storageRef = ref(storage, path)
        await uploadBytes(storageRef, file)
        const downloadUrl = await getDownloadURL(storageRef)
        await add(
          'files',
          { name: file.name, url: downloadUrl, path, size: file.size, type: file.type },
          `Uploaded: ${file.name}`
        )
      }
    } catch (err) {
      toast.error(err.message, { id: 'sum' })
    } finally {
      setSummarizingId(null)
      e.target.value = ''
    }
  }

  const handleSummarizeFile = async (f) => {
    if (!configured) {
      toast.error('AI not configured')
      return
    }
    if (!f.url) {
      toast.error('File URL missing')
      return
    }

    setSummarizingId(f.id)
    try {
      toast.loading('Fetching & analyzing…', { id: 'sum' })
      const res = await fetch(f.url)
      const blob = await res.blob()
      const file = new File([blob], f.name, { type: f.type || blob.type })
      const summary = await summarizeFile(file)
      showSummary(`Summary: ${f.name}`, summary, f.name)
      toast.success('Summary ready', { id: 'sum' })
    } catch (err) {
      toast.error(err.message, { id: 'sum' })
    } finally {
      setSummarizingId(null)
    }
  }

  const handleUrlSummarize = async (e) => {
    e.preventDefault()
    if (!url.trim()) return
    if (!configured) {
      toast.error('AI not configured')
      return
    }

    setFetchingUrl(true)
    try {
      toast.loading('Fetching from internet & summarizing…', { id: 'url' })
      const summary = await summarizeUrl(url.trim())
      showSummary('Web page summary', summary, url.trim())
      toast.success('Summary ready', { id: 'url' })
      setUrl('')
    } catch (err) {
      toast.error(err.message, { id: 'url' })
    } finally {
      setFetchingUrl(false)
    }
  }

  const handleDelete = async (f) => {
    if (!confirm(`Delete ${f.name}?`)) return
    try {
      if (f.path) await deleteObject(ref(storage, f.path))
      await remove('files', f.id, `Deleted file: ${f.name}`)
      toast.success('Deleted')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      <Card className="border-indigo-500/20 bg-indigo-500/5">
        <div className="mb-3 flex items-center gap-2">
          <Globe size={18} className="text-indigo-400" />
          <h2 className="font-semibold text-white">Fetch & summarize from internet</h2>
        </div>
        <p className="mb-4 text-sm text-zinc-400">
          Paste any article, docs, or web page URL — AI fetches the content and gives a full structured summary.
        </p>
        <form onSubmit={handleUrlSummarize} className="flex flex-col gap-3 sm:flex-row">
          <Input
            label=""
            type="url"
            placeholder="https://example.com/article"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={fetchingUrl || !configured} className="sm:self-end">
            <Link2 size={16} /> {fetchingUrl ? 'Working…' : 'Fetch & summarize'}
          </Button>
        </form>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-indigo-500/30 bg-indigo-500/5 px-6 py-8 transition hover:border-indigo-500/50">
          <Upload size={20} className="text-indigo-400" />
          <span className="text-sm text-zinc-300">{uploading ? 'Uploading…' : 'Upload to cloud storage'}</span>
          <input ref={uploadInputRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-violet-500/30 bg-violet-500/5 px-6 py-8 transition hover:border-violet-500/50">
          <Sparkles size={20} className="text-violet-400" />
          <span className="text-sm text-zinc-300">
            {summarizingId === 'upload' ? 'Analyzing…' : 'Upload + AI full summary'}
          </span>
          <span className="text-[10px] text-zinc-500">PDF, images, text files</span>
          <input
            ref={summarizeInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.webp,.html,.htm,text/*,application/pdf,image/*"
            onChange={handleUploadAndSummarize}
            disabled={!configured || summarizingId === 'upload'}
          />
        </label>
      </div>

      {loading ? (
        <p className="text-center text-zinc-500">Loading…</p>
      ) : files.length === 0 ? (
        <EmptyState
          icon={File}
          title="No files yet"
          description="Upload documents or fetch a URL above for AI-powered summaries."
        />
      ) : (
        <div className="grid gap-3">
          {files.map((f) => (
            <Card key={f.id} className="flex flex-wrap items-center gap-3">
              <div className="rounded-lg bg-indigo-500/10 p-3 text-indigo-400">
                <File size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">{f.name}</p>
                <p className="text-xs text-zinc-500">
                  {formatSize(f.size || 0)}
                  {f.createdAt?.toDate && ` · ${format(f.createdAt.toDate(), 'MMM d, yyyy')}`}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={!configured || summarizingId === f.id}
                onClick={() => handleSummarizeFile(f)}
              >
                <Sparkles size={14} /> {summarizingId === f.id ? '…' : 'Summarize'}
              </Button>
              <a href={f.url} download={f.name} target="_blank" rel="noreferrer">
                <Button variant="ghost" size="sm">
                  <Download size={16} />
                </Button>
              </a>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(f)}>
                <Trash2 size={16} className="text-rose-400" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <SummaryModal
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        title={summaryTitle}
        summary={summaryText}
        source={summarySource}
      />
    </div>
  )
}
