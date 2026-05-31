import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {
  callGemini,
  fetchWebPage,
  isKeyConfigured,
  readJsonBody,
  sendJson,
} from './server/aiShared.js'

function aiApiPlugin(apiKey) {
  const configured = isKeyConfigured(apiKey)

  return {
    name: 'ap-track-ai-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0]
        const isChat = path === '/api/chat'
        const isStatus = path === '/api/chat/status'
        const isFetch = path === '/api/fetch-url'

        if (!isChat && !isStatus && !isFetch) return next()

        if (isStatus && req.method === 'GET') {
          sendJson(res, 200, { configured })
          return
        }

        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed' })
          return
        }

        if (!configured) {
          sendJson(res, 503, {
            error: 'GEMINI_API_KEY missing in .env. Restart npm run dev after adding it.',
          })
          return
        }

        try {
          if (isFetch) {
            const body = await readJsonBody(req)
            const page = await fetchWebPage(body.url)
            sendJson(res, 200, page)
            return
          }

          if (isChat) {
            const body = await readJsonBody(req)
            const result = await callGemini(apiKey, body)
            if (result.ok) {
              sendJson(res, 200, result.data)
              return
            }
            sendJson(res, 502, { error: result.error })
            return
          }

          sendJson(res, 404, { error: 'Not found' })
        } catch (e) {
          const msg = e.name === 'AbortError' ? 'URL fetch timed out' : e.message
          sendJson(res, 500, { error: msg || 'Server error' })
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const geminiKey = (env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || '').trim()

  return {
    plugins: [react(), tailwindcss(), aiApiPlugin(geminiKey)],
    server: {
      port: 5173,
      host: true,
      strictPort: false,
      open: true,
    },
    build: {
      chunkSizeWarningLimit: 600,
    },
  }
})
