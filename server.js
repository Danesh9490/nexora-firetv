```javascript
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 10000;

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://nexora-firetv.vercel.app',
  process.env.FRONTEND_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn('CORS blocked origin:', origin);
      return callback(new Error('Origin not allowed by CORS'));
    },
  })
);

app.use(express.json({ limit: '20kb' }));

// Basic service health check
app.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: 'Nexora AI',
    provider: 'Groq',
    model: MODEL,
  });
});

// Support both health URLs
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'Nexora AI' });
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'Nexora AI',
    provider: 'Groq',
    model: MODEL,
  });
});

// AI assistant endpoint
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

  if (message.length > 4000) {
    return res.status(400).json({
      error: 'Please keep your message under 4000 characters.',
    });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error('Configuration error: GROQ_API_KEY is missing.');

    return res.status(500).json({
      error: 'The AI service is not configured. Please check the backend settings.',
    });
  }

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are Nexora, a friendly activity guide for a family-friendly Fire TV app. Give practical, enjoyable activity suggestions tailored to the user. Use short headings and clear steps when useful. Keep all suggestions appropriate for a general audience. Always provide a direct, user-facing answer. Do not return an empty answer.',
          },
          {
            role: 'user',
            content: message,
          },
        ],
        reasoning_effort: 'low',
        include_reasoning: false,
        max_completion_tokens: 2048,
        temperature: 0.7,
        stream: false,
      }),
      signal: AbortSignal.timeout(45000),
    });

    const responseText = await response.text();

    let data = {};

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      console.error(
        'Groq returned a non-JSON response. HTTP status:',
        response.status
      );

      return res.status(502).json({
        error: 'The AI provider returned an invalid response. Please try again.',
      });
    }

    if (!response.ok) {
      const providerMessage =
        data.error?.message || 'No provider error details';

      // Do not log API keys or request authorization headers.
      console.error('Groq API error:', {
        status: response.status,
        message: providerMessage,
        code: data.error?.code,
        type: data.error?.type,
      });

      if (response.status === 401 || response.status === 403) {
        return res.status(502).json({
          error: 'The AI provider rejected its credentials. Please check the backend API key.',
        });
      }

      if (response.status === 429) {
        return res.status(502).json({
          error: 'The AI service is temporarily busy or its usage limit has been reached. Please try again later.',
        });
      }

      return res.status(502).json({
        error: 'The AI provider could not complete your request. Please try again.',
      });
    }

    const choice = data.choices?.[0];
    const answer = choice?.message?.content;

    // Diagnose empty responses without logging private user prompts.
    if (typeof answer !== 'string' || !answer.trim()) {
      console.error('Groq returned no answer text:', {
        model: data.model || MODEL,
        finishReason: choice?.finish_reason || null,
        messageKeys: Object.keys(choice?.message || {}),
        hasReasoning: Boolean(choice?.message?.reasoning),
        usage: data.usage || null,
      });

      return res.status(502).json({
        error: 'The AI provider returned an empty answer. Please try again.',
      });
    }

    console.log('Nexora AI request completed successfully.');

    return res.json({
      reply: answer.trim(),
    });
  } catch (error) {
    console.error('Nexora AI request failed:', error.name, error.message);

    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({
        error: 'The AI service took too long to respond. Please try again.',
      });
    }

    return res.status(502).json({
      error: 'Could not connect to the AI provider. Please try again.',
    });
  }
});

// Handle invalid JSON and other Express errors
app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      error: 'Invalid request format.',
    });
  }

  if (error.message === 'Origin not allowed by CORS') {
    return res.status(403).json({
      error: 'This website is not allowed to access the AI service.',
    });
  }

  console.error('Backend error:', error.message);

  return res.status(500).json({
    error: 'An unexpected backend error occurred.',
  });
});

app.listen(PORT, () => {
  console.log(`Nexora AI backend listening on port ${PORT}`);
  console.log(`Provider: Groq | Model: ${MODEL}`);
});
```