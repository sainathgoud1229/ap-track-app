import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { callGemini, fetchWebPage, isKeyConfigured } from './aiShared.js';

dotenv.config();

const app = express();

// Allow the deployed Vercel frontend (set FRONTEND_URL in Render env vars)
// Falls back to '*' for local development
const allowedOrigin = process.env.FRONTEND_URL || '*';
app.use(cors({
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Health check — keeps Render happy
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'ap-track-backend' });
});

app.get('/api/chat/status', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const configured = isKeyConfigured(apiKey);
  res.json({ configured });
});

app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const configured = isKeyConfigured(apiKey);

  if (!configured) {
    res.status(503).json({ error: 'Set GEMINI_API_KEY environment variable' });
    return;
  }

  try {
    const result = await callGemini(apiKey, req.body);
    if (result.ok) {
      res.json(result.data);
      return;
    }
    res.status(502).json({ error: result.error });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Server error' });
  }
});

app.post('/api/fetchUrl', async (req, res) => {
  try {
    const page = await fetchWebPage(req.body.url);
    res.json(page);
  } catch (e) {
    res.status(500).json({ error: e.message || 'Fetch failed' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);
  console.log(`CORS allowed origin: ${allowedOrigin}`);
});
