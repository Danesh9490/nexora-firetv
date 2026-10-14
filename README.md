# NEXORA Fire TV

A TV-friendly activity discovery experience with five hubs and a local-first AI guide powered by Ollama and Gemma.

## Features

- Five hubs: Learning, Wellness, Family, Daily Brain, and Nexora AI.
- Remote-friendly focus states and keyboard/D-pad navigation.
- Quick prompts for relaxation, energy, creativity, and brain challenges.
- Concise, structured activity recommendations from a local Gemma model.
- Loading, validation, timeout, and connection-error states.
- Local-first AI: prompts are sent to the local backend and Ollama service.

## Requirements

- Node.js 20+ (a recent LTS version is recommended)
- Ollama installed and running
- A model downloaded locally, for example `gemma3:1b`

## Run locally

Open a terminal in the project folder:

```bash
npm install
ollama pull gemma3:1b
```

Terminal 1 — start the AI backend:

```bash
node server.js
```

Terminal 2 — start the Vite frontend:

```bash
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`). Keep both terminals running while using local AI.

Health check: open `http://127.0.0.1:3001/api/health`. This checks the backend process; the Ollama model is contacted when you submit a prompt.

## Keyboard / remote controls

- Arrow keys: move focus through visible interactive controls.
- Enter / OK: activate the focused button or card.
- Escape: return to the home screen.
- Backspace: return home when focus is not in a text field.

Navigation should be tested with the actual target TV/device as well as a desktop keyboard. Remote behavior varies by device/browser.

## Architecture

- Frontend: React + Vite
- Backend: Node.js + Express
- Local inference: Ollama HTTP API + Gemma
- Frontend `/api` requests are proxied by Vite to the local Express server during development.

## Important deployment note

The local Ollama backend is for local development and demos. A static GitHub Pages deployment cannot call a visitor's `127.0.0.1` service. Do not expose your local Ollama server directly to the public internet. A public demo needs a separately hosted, secured backend or a documented local run mode.

## Project status

This project is under active development. Verify features in your environment before describing them as production-ready.
