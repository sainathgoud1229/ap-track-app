const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
]

export function isKeyConfigured(apiKey) {
  return Boolean(apiKey && !String(apiKey).includes('your_'))
}

export async function callGemini(apiKey, body) {
  let lastError = 'Gemini request failed'
  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) return { ok: true, data }
    lastError = data?.error?.message || res.statusText
    const retry =
      /not found|NOT_FOUND|does not exist/i.test(String(lastError)) ||
      (res.status === 429 && /model:/i.test(String(lastError)))
    if (!retry) break
  }
  return { ok: false, error: lastError }
}

export function htmlToText(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

export function extractTitle(html) {
  const match = String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  return match ? match[1].replace(/\s+/g, ' ').trim() : 'Web page'
}

export function isValidHttpUrl(value) {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export async function fetchWebPage(url) {
  if (!isValidHttpUrl(url)) {
    throw new Error('Enter a valid http or https URL')
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20000)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; APTrackBot/1.0; +https://ap-track.app)',
        Accept: 'text/html,application/xhtml+xml,text/plain,application/json;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    })

    if (!res.ok) throw new Error(`Could not fetch URL (${res.status})`)

    const contentType = res.headers.get('content-type') || ''
    const raw = await res.text()
    const maxLen = 80000

    if (contentType.includes('application/json')) {
      try {
        const pretty = JSON.stringify(JSON.parse(raw), null, 2).slice(0, maxLen)
        return { url, title: url, text: pretty, contentType: 'application/json' }
      } catch {
        return { url, title: url, text: raw.slice(0, maxLen), contentType: 'text/plain' }
      }
    }

    if (contentType.includes('text/html') || raw.includes('<html')) {
      const title = extractTitle(raw)
      const text = htmlToText(raw).slice(0, maxLen)
      if (text.length < 80) throw new Error('Page has too little readable text')
      return { url, title, text, contentType: 'text/html' }
    }

    const text = raw.slice(0, maxLen)
    if (text.length < 20) throw new Error('Page content is too short to summarize')
    return { url, title: url, text, contentType: contentType || 'text/plain' }
  } finally {
    clearTimeout(timer)
  }
}

export async function readJsonBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString()
  return JSON.parse(raw)
}

export function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}
