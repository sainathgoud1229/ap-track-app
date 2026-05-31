const { onRequest } = require('firebase-functions/v2/https')
const { callGemini, fetchWebPage, isKeyConfigured } = require('./aiShared')

exports.chat = onRequest({ cors: true, maxInstances: 10 }, async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  const configured = isKeyConfigured(apiKey)
  const path = req.path || req.url || ''

  if (req.method === 'GET' && path.includes('status')) {
    res.json({ configured })
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!configured) {
    res.status(503).json({ error: 'Set GEMINI_API_KEY via firebase functions:secrets:set GEMINI_API_KEY' })
    return
  }

  try {
    const result = await callGemini(apiKey, req.body)
    if (result.ok) {
      res.json(result.data)
      return
    }
    res.status(502).json({ error: result.error })
  } catch (e) {
    res.status(500).json({ error: e.message || 'Server error' })
  }
})

exports.fetchUrl = onRequest({ cors: true, maxInstances: 10 }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const page = await fetchWebPage(req.body.url)
    res.json(page)
  } catch (e) {
    res.status(500).json({ error: e.message || 'Fetch failed' })
  }
})
