import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Mic, MicOff, Paperclip, RotateCcw, Send, Sparkles, User, Volume2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { useCollection } from '../../hooks/useCollection'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'
import { useAiStatus } from '../../hooks/useAiStatus'
import {
  chatWithAi,
  prepareFileForAi,
  speakText,
  stopSpeaking,
  summarizeAllNotes,
  CHAT_SUGGESTIONS,
} from '../../lib/ai'
import Button from '../ui/Button'

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  )
}

function MessageBubble({ role, content }) {
  const isUser = role === 'user'
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          isUser ? 'bg-indigo-600' : 'bg-white/10'
        }`}
      >
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-indigo-300" />}
      </div>
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-indigo-600 text-white rounded-tr-sm'
            : 'border border-white/10 bg-zinc-800/80 text-zinc-100 rounded-tl-sm'
        }`}
      >
        {content}
      </div>
    </div>
  )
}

function buildWelcome(configured) {
  return {
    role: 'assistant',
    welcome: true,
    content: configured
      ? "Hi! I'm AP Track AI — ask anything, paste a URL, or attach a PDF/image/file. I'll fetch web pages and give full summaries like ChatGPT."
      : 'AI is not connected. Add GEMINI_API_KEY to .env (never commit this file), restart npm run dev, then refresh this page.',
  }
}

export default function ChatAssistant() {
  const { user } = useAuth()
  const { configured, loading: aiLoading } = useAiStatus()
  const { docs: notes } = useCollection(user?.uid, 'notes')
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [attachment, setAttachment] = useState(null)
  const listRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!aiLoading) {
      setMessages([buildWelcome(configured)])
    }
  }, [configured, aiLoading])

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    })
  }, [])

  const appendMessage = useCallback(
    (msg) => {
      setMessages((prev) => [...prev, msg])
      scrollToBottom()
    },
    [scrollToBottom]
  )

  const resetChat = () => {
    stopSpeaking()
    setMessages([buildWelcome(configured)])
    setInput('')
    setAttachment(null)
  }

  const handleVoiceResult = useCallback((transcript) => {
    setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
  }, [])

  const { listening, supported, toggle: toggleMic } = useSpeechRecognition({
    onResult: handleVoiceResult,
    lang: 'en-IN',
  })

  const sendMessage = async (text) => {
    const trimmed = text.trim()
    if ((!trimmed && !attachment) || loading) return

    if (!configured) {
      toast.error('Add GEMINI_API_KEY to .env and restart npm run dev.')
      return
    }

    const display = trimmed || (attachment ? `[Attached: ${attachment.fileName}] Summarize this fully.` : '')
    const history = messages.filter((m) => m.role === 'user' || m.role === 'assistant')
    appendMessage({ role: 'user', content: display })
    setInput('')
    setLoading(true)

    const filePayload = attachment
    setAttachment(null)

    try {
      const reply = await chatWithAi(trimmed || 'Summarize this attachment in full detail.', history, filePayload)
      appendMessage({ role: 'assistant', content: reply })
    } catch (err) {
      toast.error(err.message)
      appendMessage({ role: 'assistant', content: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleFileAttach = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const prepared = await prepareFileForAi(file)
      setAttachment(prepared)
      toast.success(`Attached: ${file.name}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      e.target.value = ''
    }
  }

  const handleSummarizeNotes = async () => {
    if (loading || !configured) return
    appendMessage({ role: 'user', content: 'Summarize all my notes' })
    setLoading(true)
    try {
      const summary = await summarizeAllNotes(notes)
      appendMessage({ role: 'assistant', content: summary })
    } catch (err) {
      toast.error(err.message)
      appendMessage({ role: 'assistant', content: err.message })
    } finally {
      setLoading(false)
    }
  }

  const readLastReply = () => {
    const last = [...messages].reverse().find((m) => m.role === 'assistant' && !m.welcome)
    if (!last) return
    if (!speakText(last.content)) toast.error('Text-to-speech not supported in this browser.')
  }

  if (!user) return null

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            className="fixed bottom-24 right-4 z-50 flex h-[min(560px,calc(100vh-6rem))] w-[min(420px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/98 shadow-2xl shadow-black/50 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">AP Track AI</p>
                  <p className="text-[10px] text-zinc-500">
                    {aiLoading ? 'Checking…' : configured ? 'Online · Gemini' : 'Offline · add API key'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button type="button" onClick={resetChat} className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white" title="New chat">
                  <RotateCcw size={15} />
                </button>
                <button type="button" onClick={readLastReply} className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-indigo-300" title="Read aloud">
                  <Volume2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopSpeaking()
                    setOpen(false)
                  }}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <MessageBubble key={`${m.role}-${i}`} role={m.role} content={m.content} />
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10">
                    <Bot size={14} className="text-indigo-300" />
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-zinc-800/80 rounded-tl-sm">
                    <TypingIndicator />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 bg-zinc-900/50 p-3">
              {configured && messages.length <= 2 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {CHAT_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendMessage(s)}
                      disabled={loading}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-zinc-300 hover:border-indigo-500/40 hover:text-indigo-200 disabled:opacity-40"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              <div className="mb-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSummarizeNotes}
                  disabled={loading || !notes.length || !configured}
                  className="flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] text-indigo-300 disabled:opacity-40"
                >
                  <Sparkles size={12} /> Summarize notes
                </button>
              </div>

              {attachment && (
                <div className="mb-2 flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-1.5 text-xs text-violet-200">
                  <Paperclip size={12} />
                  <span className="truncate flex-1">{attachment.fileName}</span>
                  <button type="button" onClick={() => setAttachment(null)} className="text-zinc-400 hover:text-white">
                    <X size={12} />
                  </button>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  sendMessage(input)
                }}
                className="flex items-end gap-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.webp,text/*,application/pdf,image/*"
                  onChange={handleFileAttach}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!configured || loading}
                  className="rounded-xl bg-white/5 p-2.5 text-zinc-400 hover:text-indigo-300 disabled:opacity-40"
                  title="Attach file"
                >
                  <Paperclip size={18} />
                </button>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage(input)
                    }
                  }}
                  rows={2}
                  placeholder={
                    configured
                      ? listening
                        ? 'Listening...'
                        : 'Message, URL, or attach file...'
                      : 'Add GEMINI_API_KEY to .env, restart server'
                  }
                  disabled={!configured}
                  className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-indigo-500/50 disabled:opacity-50"
                />
                {supported && (
                  <button
                    type="button"
                    onClick={toggleMic}
                    disabled={!configured}
                    className={`rounded-xl p-2.5 transition disabled:opacity-40 ${
                      listening ? 'bg-rose-500/20 text-rose-400' : 'bg-white/5 text-zinc-400 hover:text-indigo-300'
                    }`}
                  >
                    {listening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                )}
                <Button type="submit" disabled={loading || (!input.trim() && !attachment) || !configured} className="px-3">
                  <Send size={16} />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30"
        title="Open AI chat"
      >
        <Bot size={24} />
        {configured && (
          <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-zinc-900 bg-emerald-400" />
        )}
      </motion.button>
    </>
  )
}
