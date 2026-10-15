🚀 NEXORA Fire TV

An AI-powered, TV-friendly activity discovery experience.

"🌐 Live Demo" (https://nexora-firetv.vercel.app/) · "🐛 Report a Bug" (https://github.com/Danesh9490/nexora-firetv/issues) · "💻 Source Code" (https://github.com/Danesh9490/nexora-firetv)

✨ Features

- 🎓 Learning Hub — Discover educational activities.
- 🌿 Wellness Hub — Find relaxation and wellbeing ideas.
- 👨‍👩‍👧 Family Hub — Explore activities for family time.
- 🧠 Daily Brain — Try puzzles and brain challenges.
- 🤖 NEXORA AI — Get personalized activity recommendations.
- 🎮 TV-friendly navigation — Keyboard and directional controls.
- 📱 Responsive interface — Use the app on supported mobile and desktop browsers.
- ⚡ Helpful feedback — Loading, validation, and error states.

🛠️ Technology Stack

- Frontend: React and Vite
- Backend: Node.js and Express
- AI provider: Groq API
- Frontend hosting: Vercel
- Backend hosting: Render
- Automation: GitHub Actions

🏗️ Architecture

1. The user selects a hub or enters a request.
2. The frontend sends the request to the Express backend.
3. The backend securely calls the Groq API.
4. NEXORA displays the generated activity.

🚀 Live Demo

Try NEXORA: https://nexora-firetv.vercel.app/

The backend is hosted separately. Its availability may vary because the hosting provider's free service can sleep when inactive.

🔐 Environment Variables

Configure these in your hosting provider's environment-variable settings.

Backend on Render

- "GROQ_API_KEY" — Your private Groq API key.
- "GROQ_MODEL" — Optional model override.

Frontend on Vercel

- "VITE_API_BASE_URL" — The base URL of your deployed backend.

Never commit API keys, passwords, or other secrets to GitHub.

💻 Local Development

Requirements:

- Node.js and npm
- A Groq API key
- The project dependencies installed

1. Clone the repository:
   
   git clone https://github.com/Danesh9490/nexora-firetv.git
cd nexora-firetv

2. Install the project dependencies:
   
   npm install

3. Configure the required backend environment variables and start the backend according to the project's server configuration.

4. In a separate terminal, start the Vite development server:
   
   npm run dev

Follow the terminal output to open the local development URL.

🧭 Remote Navigation

- Arrow keys: Move focus.
- Enter / OK: Activate the selected control.
- Escape: Return to the home screen.

Actual Fire TV compatibility should be tested on the intended device.

🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome!

1. Explore the existing issues.
2. Describe the change you want to make.
3. Submit a pull request with a clear explanation of your changes.

Please test your changes before submitting them.

🗺️ Roadmap

- Improve accessibility and TV remote navigation.
- Expand automated tests.
- Add screenshots and a demonstration video.
- Improve activity recommendations and error handling.

📄 License

This project is licensed under the MIT License. See "LICENSE" (LICENSE).

---

Built to make discovering your next good activity simple.
