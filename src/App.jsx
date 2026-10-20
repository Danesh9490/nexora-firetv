
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 10000;
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://nexora-firetv.vercel.app',
      process.env.FRONTEND_ORIGIN,
    ].filter(Boolean),
  })
);

app.use(express.json({ limit: '20kb' }));

const SYSTEM_PROMPT = `You are Nexora, a friendly, family-friendly activity guide.

Recommend one practical activity matching the user's request, mood,
interests, and available time.

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

Keep answers concise, clear, warm, safe, and easy to read on a television.
Use plain text and normal line breaks. Never output HTML or code fences.
Do not return an empty answer.`;

const PLANNER_ACTIONS = ['create', 'revise'];

async function callGroq(systemPrompt, userMessage, temperature = 0.5) {
  if (!process.env.GROQ_API_KEY) {
    const error = new Error(
      'GROQ_API_KEY is missing from backend settings.'
    );
    error.status = 500;
    throw error;
  }

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_completion_tokens: 1024,
      temperature,
      stream: false,
    }),
    signal: AbortSignal.timeout(45000),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error(
      'Groq error:',
      response.status,
      data.error?.message || 'Unknown provider error'
    );

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

function handleApiError(error, res, label) {
  console.error(`${label}:`, error.message);

  if (error.status) {
    return res.status(error.status).json({ error: error.message });
  }

  if (error.name === 'TimeoutError' || error.name === 'AbortError') {
    return res.status(504).json({
      error: 'The AI request timed out. Please try again.',
    });
  }

  return res.status(502).json({
    error: 'Could not connect to the AI provider. Please try again.',
  });
}

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'Nexora AI' });
});

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'Nexora AI',
    plannerAvailable: true,
  });
});

// Existing Nexora AI endpoint — retained for the current frontend.
app.post('/api/assistant', async (req, res) => {
  const message =
    typeof req.body?.message === 'string'
      ? req.body.message.trim()
      : '';

  if (!message) {
    return res.status(400).json({
      error: 'Please enter a message.',
    });
  }

  try {
    const reply = await callGroq(SYSTEM_PROMPT, message, 0.7);
    return res.json({ reply });
  } catch (error) {
    return handleApiError(error, res, 'AI request failed');
  }
});

// Activity planner — supports creating and revising a plan.
app.post('/api/planner', async (req, res) => {
  const message =
    typeof req.body?.message === 'string'
      ? req.body.message.trim()
      : '';

  const action = req.body?.action;

  const currentPlan =
    typeof req.body?.currentPlan === 'string'
      ? req.body.currentPlan.trim()
      : '';

  if (!message) {
    return res.status(400).json({
      error: 'Please describe the activity you want to plan.',
    });
  }

  if (message.length > 4000) {
    return res.status(400).json({
      error: 'Please keep your request under 4,000 characters.',
    });
  }

  if (!PLANNER_ACTIONS.includes(action)) {
    return res.status(400).json({
      error: 'Choose a valid planner action: create or revise.',
    });
  }

  if (action === 'revise' && !currentPlan) {
    return res.status(400).json({
      error: 'Create an activity plan before revising it.',
    });
  }

  if (currentPlan.length > 8000) {
    return res.status(400).json({
      error: 'The current plan is too long to revise.',
    });
  }

  const plannerPrompt = `You are Nexora Activity Planner, an assistant that creates and revises practical activity plans.

WORKFLOW ACTION: ${action}

${
  action === 'revise'
    ? `CURRENT PLAN:
${currentPlan}

Revise the current plan according to the user's new request. Preserve useful details unless asked to change them. Do not simply generate an unrelated new plan.`
    : 'Create a new activity plan based on the user request.'
}

If essential details are missing, ask one concise clarifying question instead of inventing personal preferences.

If enough information is available, respond in this exact plain-text structure:

STATUS: PLAN
ACTIVITY: Clear activity title
DURATION: Realistic duration
MATERIALS: Required items, or None
STEPS:
1. First step
2. Second step
3. Additional steps if useful
NEXT ACTION: One useful optional improvement or continuation

If you need clarification, respond in this structure:

STATUS: QUESTION
QUESTION: One specific, concise question

Keep activities practical, safe, family-friendly, and easy to follow.
Do not claim to have performed real-world actions.
Do not output HTML, Markdown tables, or code fences.`;

  try {
    const reply = await callGroq(plannerPrompt, message, 0.4);

    // Return the updated plan to the client. The client must retain this
    // response as currentPlan when the user requests a later revision.
    return res.json({
      action,
      reply,
      currentPlan: reply,
    });
  } catch (error) {
    return handleApiError(error, res, 'Planner request failed');
  }
});

// Handle malformed JSON requests.
app.use((error, _req, res, next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      error: 'Invalid JSON request body.',
    });
  }

  return next(error);
});

app.listen(PORT, () => {
  console.log(`Nexora AI listening on port ${PORT}`);
});
