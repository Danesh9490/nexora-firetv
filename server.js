
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

Keep answers concise, clear, warm, and safe for a general audience.
Use plain text only, no Markdown, HTML, or code fences.
Never return an empty answer.`;

async function callGroq(systemPrompt, userMessage, temperature = 0.7) {
  if (!process.env.GROQ_API_KEY) {
    const error = new Error('GROQ_API_KEY is missing from backend settings.');
    error.status = 500;
    throw error;
  }

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_completion_tokens: 1024,
      temperature,
      stream: false
    }),
    signal: AbortSignal.timeout(45000)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('Groq error:', response.status, data.error?.message);
    const error = new Error(
      response.status === 429
        ? 'The AI service is busy or its usage limit was reached.'
        : 'The AI provider could not complete your request.'
    );
    error.status = 502;
    throw error;
  }

  const reply = data.choices?.[0]?.message?.content;

  if (typeof reply !== 'string' || !reply.trim()) {
    const error = new Error('The AI provider returned an empty answer.');
    error.status = 502;
    throw error;
  }

  return reply.trim();
}

function sendAIError(res, error) {
  console.error('Nexora AI error:', error.message);

  if (error.name === 'TimeoutError' ||
      error.name === 'AbortError') {
    return res.status(504).json({
      error: 'The AI request timed out. Please try again.'
    });
  }

  return res.status(error.status || 502).json({
    error: error.status === 500
      ? error.message
      : error.message || 'The AI request failed.'
  });
}

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'Nexora AI' });
});

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'Nexora AI',
    plannerAvailable: true
  });
});

app.post('/api/assistant', async (req, res) => {
  const message = typeof req.body?.message === 'string'
    ? req.body.message.trim()
    : '';

  if (!message) {
    return res.status(400).json({
      error: 'Please enter a message.'
    });
  }

  try {
    const reply = await callGroq(SYSTEM_PROMPT, message);
    return res.json({ reply });
  } catch (error) {
    return sendAIError(res, error);
  }
});

const PLANNER_SYSTEM_PROMPT = `You are Nexora's Activity Planner.
Help users create practical, safe, family-friendly activity plans.

For a complete plan, respond using this exact plain-text structure:

STATUS: PLAN
ACTIVITY: Clear activity title
HUB: Learning Hub, Wellness Hub, Family Hub, or Daily Brain
TIME: Realistic duration
MATERIALS: List materials, or None
WHY IT FITS: One specific sentence
STEPS:
1. Clear action
2. Clear action
3. Clear action if useful
NEXT ACTION: One simple action to begin

Keep the plan concise and easy to read on a television.
Use plain text only. Do not use Markdown, HTML, or code fences.
If essential information is missing, ask one short question starting with:
STATUS: QUESTION
QUESTION: Your question

Never claim to have performed real-world actions or used tools you do not have.`;

app.post('/api/planner', async (req, res) => {
  const action = req.body?.action;
  const message = typeof req.body?.message === 'string'
    ? req.body.message.trim()
    : '';
  const currentPlan = typeof req.body?.currentPlan === 'string'
    ? req.body.currentPlan.trim()
    : '';

  if (!['create', 'revise'].includes(action)) {
    return res.status(400).json({
      error: 'Choose create or revise for the planner action.'
    });
  }

  if (!message) {
    return res.status(400).json({
      error: 'Describe the activity you want to plan.'
    });
  }

  if (message.length > 4000 || currentPlan.length > 8000) {
    return res.status(413).json({
      error: 'Your request is too long. Please shorten it.'
    });
  }

  if (action === 'revise' && !currentPlan) {
    return res.status(400).json({
      error: 'Create a plan before asking Nexora to revise it.'
    });
  }

  const userMessage = action === 'revise'
    ? `Revise the existing activity plan according to the user's feedback.

EXISTING PLAN:
${currentPlan}

USER FEEDBACK:
${message}

Preserve useful details, apply the requested changes, and return the complete updated plan.`
    : `Create a structured activity plan for this request:
${message}`;

  try {
    const reply = await callGroq(
      PLANNER_SYSTEM_PROMPT,
      userMessage,
      0.5
    );

    return res.json({
      action,
      reply,
      currentPlan: reply
    });
  } catch (error) {
    return sendAIError(res, error);
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && error.status === 400) {
    return res.status(400).json({
      error: 'Invalid JSON request.'
    });
  }

  console.error('Server error:', error.message);
  return res.status(500).json({
    error: 'Unexpected server error.'
  });
});

app.listen(PORT, () => {
  console.log(`Nexora AI listening on port ${PORT}`);
});
