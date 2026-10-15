🚀 NEXORA Fire TV

An AI-powered activity discovery experience designed for Amazon Fire TV.

NEXORA helps users discover activities for learning, wellness, family time, and brain training through a TV-friendly interface and AI assistant.

🌐 Live Demo

Try the app: https://nexora-firetv.vercel.app/

✨ Features

- 📚 Learning: Discover educational activities.
- 🌿 Wellness: Explore relaxation and wellbeing ideas.
- 👨‍👩‍👧‍👦 Family: Find activities for quality family time.
- 🧠 Daily Brain: Try puzzles and brain-training challenges.
- 🤖 Nexora AI: Get AI-generated activity recommendations.
- 🎮 TV-friendly navigation: Keyboard and directional controls.
- ⚡ Quick prompts: Explore creativity, relaxation, energy, and brain challenges.
- 🛡️ Error handling: Loading, validation, timeout, and connection-error states.

🎯 Project Vision

NEXORA explores how AI can make activity discovery more engaging and accessible on a big screen.

This project is being developed for the Amazon Developer Hackathon 2026 — Fire TV track.

🧰 Technology Stack

- Frontend: React
- Build tool: Vite
- Backend: Node.js and Express
- AI integration: Groq API
- Continuous integration: GitHub Actions
- Frontend hosting: Vercel

💻 Run Locally

Requirements

- Node.js 22 or a compatible version
- npm

Installation

Clone the repository:

git clone https://github.com/Danesh9490/nexora-firetv.git

Open the project directory:

cd nexora-firetv

Install dependencies:

npm ci

Start the frontend:

npm run dev

Open the local URL printed by Vite.

Note: The frontend alone does not start the AI backend. Configure and start the backend separately to use AI features locally.

🎮 Keyboard and Remote Controls

Key| Action
Arrow keys| Move focus
Enter / OK| Activate the focused element
Escape| Return to the home screen
Backspace| Return home when not editing text

Remote behavior can vary across browsers and Fire TV devices. Test on your target device.

🏗️ Architecture

User
  |
  v
React + Vite Frontend
  |
  v
Node.js + Express Backend
  |
  v
Groq AI API
  |
  v
Activity Recommendations

🔐 Security

- Keep API keys on the backend.
- Store secrets in environment variables or your hosting provider's secret settings.
- Never commit API keys or passwords to GitHub.

⚙️ Continuous Integration

GitHub Actions checks the application build when changes are pushed to "main" or a pull request targets "main".

"View workflow runs" (https://github.com/Danesh9490/nexora-firetv/actions)

🗺️ Roadmap

- [ ] Improve AI response formatting and activity quality.
- [ ] Test navigation on a physical Fire TV device.
- [ ] Add screenshots and a demonstration video.
- [ ] Expand automated quality checks.
- [ ] Improve accessibility and TV usability.

🤝 Feedback and Contributions

Have a suggestion or found a bug? "Open a GitHub issue" (https://github.com/Danesh9490/nexora-firetv/issues).

📄 License

This project is licensed under the "MIT License" (LICENSE).

---

Built for a smarter TV activity experience.
