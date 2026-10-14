import express from 'express';

const app = express();
const PORT = Number(process.env.PORT || 3001);
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const MODEL = process.env.OLLAMA_MODEL || 'gemma3:1b';

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'Nexora AI', model: MODEL });
});

app.post('/api/assistant', async (req, res) => {
  const { message } = req.body ?? {};
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Type what you would like help with first.' });
  }
  if (message.length > 1200) {
    return res.status(413).json({ error: 'Please keep your request under 1,200 characters.' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        options: { temperature: 0.65, num_predict: 260 },
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
Adapt to the user's stated mood, time, age context, and interests. If details are missing, make a sensible low-effort suggestion instead of asking several questions. Prefer activities that need little or no equipment. For wellness, suggest gentle general wellbeing activities and do not diagnose or claim medical benefits. For brain challenges, do not reveal the answer immediately unless asked; offer a hint first. Avoid listing every hub or recommending external apps unless specifically requested. Never claim you can see the user, control their TV, or access private information.`
          },
          { role: 'user', content: message.trim() }
        ]
      })
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Ollama returned HTTP ${response.status}${detail ? `: ${detail.slice(0, 180)}` : ''}`);
    }

    const data = await response.json();
    const reply = data.message?.content?.trim();
    if (!reply) throw new Error('The model returned an empty answer.');
    return res.json({ reply });
  } catch (error) {
    console.error('Nexora AI request failed:', error.message);
    const timedOut = error.name === 'AbortError';
    return res.status(502).json({
      error: timedOut
        ? 'The AI took too long to respond. Please try again.'
        : 'Could not connect to Ollama. Make sure Ollama is running and the selected model is installed.'
    });
  } finally {
    clearTimeout(timeout);
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Nexora AI backend running at http://127.0.0.1:${PORT}`);
  console.log(`Model: ${MODEL} | Health check: http://127.0.0.1:${PORT}/api/health`);
});
