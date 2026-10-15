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
  'https://nexora-firetv.vercel.app',
  process.env.FRONTEND_ORIGIN,
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  },
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

For puzzles, ensure the challenge is solvable and the hint is relevant. Do not invent word answers or claim an
