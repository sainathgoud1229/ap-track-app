import { SUMMARY_PROMPT } from './aiPrompts'

const CHAT_API = '/api/chat'
const FETCH_API = '/api/fetch-url'
const STATUS_API = '/api/chat/status'

const SYSTEM_PROMPT = `You are AP Track AI — a capable, friendly assistant like ChatGPT.
Answer directly and completely. User tracks spending in Indian Rupees (₹).
Use bullet lists when helpful. Be practical and thorough.`

let configuredCache = null

export async function checkAiConfigured() {
  if (configuredCache !== null) return configuredCache
  try {
    const res = await fetch(STATUS_API)
    const data = await res.json()
    configuredCache = Boolean(data.configured)
  } catch {
    configuredCache = false
  }
  return configuredCache
}

export const isAiConfigured = false

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = String(reader.result).split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsText(file)
  })
}

const TEXT_TYPES = /^text\/|application\/json|application\/xml|application\/javascript/

export async function prepareFileForAi(file) {
  const maxBytes = 12 * 1024 * 1024
  if (file.size > maxBytes) throw new Error('File too large (max 12 MB)')

  const mime = file.type || 'application/octet-stream'

  if (TEXT_TYPES.test(mime) || /\.(txt|md|csv|json|xml|html|htm|js|ts|jsx|tsx|py|java|c|cpp|log)$/i.test(file.name)) {
    const text = (await readTextFile(file)).slice(0, 80000)
    return { fileName: file.name, mimeType: mime, text, base64: null }
  }

  if (mime === 'application/pdf' || /^image\//.test(mime)) {
    const base64 = await fileToBase64(file)
    return { fileName: file.name, mimeType: mime, text: '', base64 }
  }

  throw new Error('Unsupported file type. Use PDF, images, or text files.')
}

export async function fetchUrlContent(url) {
  const res = await fetch(FETCH_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: url.trim() }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Could not fetch URL')
  return data
}

async function callChatApi(contents, { maxOutputTokens = 2048, systemPrompt = SYSTEM_PROMPT } = {}) {
  const res = await fetch(CHAT_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens,
      },
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `AI request failed (${res.status})`)

  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).filter(Boolean).join('\n')
  if (!text) throw new Error('No reply from AI. Try again.')
  return text.trim()
}

function buildSummaryParts({ fileName, sourceLabel, text, base64, mimeType }) {
  const parts = []
  if (base64 && mimeType) {
    parts.push({ inline_data: { mime_type: mimeType, data: base64 } })
  }
  parts.push({
    text: `${SUMMARY_PROMPT}\n\nSource: ${sourceLabel || fileName}\nFile: ${fileName}\n\n${text ? `Content:\n${text.slice(0, 75000)}` : 'Analyze the attached document/image.'}`,
  })
  return parts
}

export async function summarizeDocument({ fileName, text, base64, mimeType, sourceLabel }) {
  return callChatApi(
    [{ role: 'user', parts: buildSummaryParts({ fileName, sourceLabel, text, base64, mimeType }) }],
    { maxOutputTokens: 4096, systemPrompt: SYSTEM_PROMPT + '\nYou produce detailed, structured summaries.' }
  )
}

export async function summarizeUrl(url) {
  const page = await fetchUrlContent(url)
  return summarizeDocument({
    fileName: page.title || 'Web page',
    text: page.text,
    base64: null,
    mimeType: null,
    sourceLabel: page.url,
  })
}

export async function summarizeFile(file) {
  const prepared = await prepareFileForAi(file)
  return summarizeDocument({
    fileName: prepared.fileName,
    text: prepared.text,
    base64: prepared.base64,
    mimeType: prepared.mimeType,
    sourceLabel: 'Uploaded file',
  })
}

function toGeminiContents(history, userMessage) {
  const turns = []
  for (const m of history) {
    if (m.welcome) continue
    if (m.role === 'user') turns.push({ role: 'user', parts: [{ text: m.content }] })
    else if (m.role === 'assistant') turns.push({ role: 'model', parts: [{ text: m.content }] })
  }
  const last = turns[turns.length - 1]
  if (!(last?.role === 'user' && last.parts[0]?.text === userMessage)) {
    turns.push({ role: 'user', parts: [{ text: userMessage }] })
  }
  return turns
}

const URL_RE = /https?:\/\/[^\s<>"']+/gi

export async function chatWithAi(message, history = [], attachment = null) {
  const urlMatch = message.match(URL_RE)
  let enriched = message

  if (urlMatch?.length && !attachment) {
    try {
      const page = await fetchUrlContent(urlMatch[0])
      enriched = `${message}\n\n[Fetched web content from ${page.url}]\nTitle: ${page.title}\n\n${page.text.slice(0, 12000)}`
    } catch {
      // continue without fetch
    }
  }

  if (attachment) {
    const parts = buildSummaryParts({
      fileName: attachment.fileName,
      text: attachment.text,
      base64: attachment.base64,
      mimeType: attachment.mimeType,
      sourceLabel: 'Chat attachment',
    })
    parts[parts.length - 1].text = `${enriched}\n\n${parts[parts.length - 1].text}`
    return callChatApi([{ role: 'user', parts }], { maxOutputTokens: 4096 })
  }

  const filtered = history.filter((m) => !m.welcome && (m.role === 'user' || m.role === 'assistant'))
  return callChatApi(toGeminiContents(filtered, enriched))
}

export async function summarizeAllNotes(notes) {
  if (!notes?.length) return 'You have no notes to summarize yet.'
  const text = notes
    .map(
      (n, i) =>
        `### ${n.title || `Note ${i + 1}`}\n${(n.content || '').replace(/<[^>]+>/g, ' ').trim().slice(0, 800)}`
    )
    .join('\n\n')
  return callChatApi(
    [{ role: 'user', parts: [{ text: `${SUMMARY_PROMPT}\n\nNotes:\n${text}` }] }],
    { maxOutputTokens: 4096 }
  )
}

let utterance = null

export function speakText(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false
  stopSpeaking()
  utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-IN'
  window.speechSynthesis.speak(utterance)
  return true
}

export function stopSpeaking() {
  if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
  utterance = null
}

export const CHAT_SUGGESTIONS = [
  'Summarize this URL: https://example.com',
  'Plan my productive day',
  'How can I save money in ₹?',
  'Explain React hooks simply',
]
