import { Copy, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

export default function SummaryModal({ open, onClose, title, summary, source }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title || 'AI Summary'}>
      {source && (
        <p className="mb-3 truncate text-xs text-zinc-500" title={source}>
          Source: {source}
        </p>
      )}
      <div className="max-h-[min(60vh,480px)] overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-4">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-200">{summary}</pre>
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="secondary" onClick={copy}>
          <Copy size={16} /> Copy
        </Button>
        <Button variant="secondary" onClick={onClose}>
          <X size={16} /> Close
        </Button>
      </div>
    </Modal>
  )
}
