
import express from 'express';

const app = express();
const PORT = Number(process.env.PORT || 3001);
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

const allowedOrigins = new Set([
  'http://localhost:5173',
  ...(process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
]);

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

// Allow only your deployed frontend and local development frontend.
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ error: 'Origin not allowed.' });
  }

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'Nexora AI',
    provider: 'Groq',
    model: MODEL,
  });
});

app.post('/api/assistant', async (req, res) => {
  const { message } = req.body ?? {};

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      error: 'Type what you would like help with first.',
    });
  }

  if (message.length > 1200) {
    return res.status(413).json({
      error: 'Please keep your request under 1,200 characters.',
    });
  }

  if (!process.env.GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not configured.');
    return res.status(503).json({
      error: 'The Nexora AI service is not configured yet.',
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.65,
        max_completion_tokens: 500,
        messages: [
          {
            role: 'system',
            content: `You are Nexora, a warm and practical activity guide built for a TV screen.
Help the user choose ONE useful activity from Learning Hub, Wellness Hub, Family Hub, or Daily Brain.
Be concise and easy to read from a sofa. Normally use this exact structure:
ACTIVITY: a short friendly title
HUB: one of Learning Hub, Wellness Hub, Family Hub, Daily Brain
TIME: a realistic duration
WHY IT FITS: one short sentence
LET'S DO IT:
1. Give 2–4 simple, safe steps.
TRY NEXT: one short optional variation
Adapt to the user's stated mood, time, age context, and interests. If details are missing, make a sensible low-effort suggestion instead of asking several questions. Prefer activities that need little or no equipment. For wellness, suggest gentle general wellbeing activities and do not diagnose or claim medical benefits. For brain challenges, do not reveal the answer immediately unless asked; offer a hint first. Avoid listing every hub or recommending external apps unless specifically requested. Never claim you can see the user, control their TV, or access private information.`,
          },
          { role: 'user', content: message.trim() },
        ],
      }),
    });

    if (!response.ok) {
      // Log status only; do not log the API key or request headers.
      console.error(`Groq API returned HTTP ${response.status}.`);

      return res.status(502).json({
        error:
          response.status === 429
            ? 'Nexora AI is busy right now. Please try again shortly.'
            : 'Nexora AI could not generate a response. Please try again.',
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      throw new Error('The model returned an empty answer.');
    }

    return res.json({ reply });
  } catch (error) {
    console.error(
      'Nexora AI request failed:',
      error.name === 'AbortError' ? 'Request timed out.' : error.message,
    );

    return res.status(502).json({
      error:
        error.name === 'AbortError'
          ? 'The AI took too long to respond. Please try again.'
          : 'Could not connect to the hosted AI service. Please try again.',
    });
  } finally {
    clearTimeout(timeout);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Nexora AI backend listening on port ${PORT}`);
  console.log(`Provider: Groq | Model: ${MODEL}`);
});
