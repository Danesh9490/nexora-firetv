
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 10000;
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://nexora-firetv.vercel.app',
    process.env.FRONTEND_ORIGIN
  ].filter(Boolean)
}));

app.use(express.json({ limit: '20kb' }));

const SYSTEM_PROMPT = `You are Nexora, a friendly, family-friendly activity guide for Fire TV.

Recommend one practical activity that matches the user's request, mood, interests, and available time.

Use this plain-text format:
ACTIVITY: Clear activity title
HUB: Learning Hub, Wellness Hub, Family Hub, or Daily Brain
TIME: Realistic duration
WHY IT FITS: One specific sentence
STEPS:
1. First action
2. Second action
3. Third action if useful
HINT: Include only when useful for a puzzle

Keep answers concise, clear, warm, and easy to read on a television. Use simple language and activities that are safe and practical for a general audience.

Use plain text and normal line breaks only. Never output Markdown formatting, HTML tags, or code fences. Always provide a direct, useful answer. Do not return an empty answer.`;

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'Nexora AI' });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'Nexora AI' });
});

app.post('/api/assistant', async (req, res) => {
  const message = typeof req.body?.message === 'string'
    ? req.body.message.trim()
    : '';

  if (!message) {
    return res.status(400).json({ error: 'Please enter a message.' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(500).json({
      error: 'GROQ_API_KEY is missing from backend settings.'
    });
  }

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],
        max_completion_tokens: 1024,
        temperature: 0.7,
        stream: false
      }),
      signal: AbortSignal.timeout(45000)
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('Groq error:', response.status, data.error?.message);
      return res.status(502).json({
        error: response.status === 429
          ? 'The AI service is busy or its usage limit was reached.'
          : 'The AI provider could not complete your request.'
      });
    }

    const reply = data.choices?.[0]?.message?.content;

    if (typeof reply !== 'string' || !reply.trim()) {
      return res.status(502).json({
        error: 'The AI provider returned an empty answer.'
      });
    }

    return res.json({ reply: reply.trim() });
  } catch (error) {
    console.error('AI request failed:', error.message);
    return res.status(502).json({
      error: 'Could not connect to the AI provider. Please try again.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Nexora AI listening on port ${PORT}`);
});
