🚀 NEXORA Fire TV

An AI-powered, TV-friendly activity discovery and planning experience.

NEXORA helps users discover activities for learning, relaxation, family time, and brain training. Its AI assistant generates personalized recommendations, while the Activity Planner creates structured plans and adapts them to user feedback.

Live Demo: https://nexora-firetv.vercel.app/
Source Code: https://github.com/Danesh9490/nexora-firetv
Bug Reports: https://github.com/Danesh9490/nexora-firetv/issues

✨ Features

- 🎓 Learning Hub — Discover educational activities and interesting facts.
- 🌿 Wellness Hub — Explore relaxation and wellbeing activities.
- 👨‍👩‍👧 Family Hub — Find activities for spending time together.
- 🧠 Daily Brain — Try puzzles and mental challenges.
- 🤖 NEXORA AI — Generate personalized activity recommendations.
- 🗺️ Activity Planner — Create structured activity plans and revise them using natural-language feedback.
- 🎮 TV-friendly navigation — Keyboard and directional-control support.
- 📱 Responsive interface — Designed for different screen sizes.
- ⚡ Error and loading feedback — Helpful states for requests and failures.

🧪 Tested functionality

The deployed web application has been tested for standard AI activity recommendations and Activity Planner creation and revision.

A revision test successfully adapted a plan to a two-minute duration, no materials, and three simple instructions.

Actual Fire TV or Vega OS compatibility has not yet been confirmed. Device or simulator testing and a demonstration video remain necessary for the Fire TV hackathon track.

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
4. The AI response is returned to the frontend.
5. The Activity Planner supports creating a plan and revising the current plan based on user feedback.

The backend exposes "/api/assistant" for standard AI requests and "/api/planner" for planner actions.

🔐 Environment Variables

Configure environment variables in the appropriate hosting dashboard.

Backend — Render

- "GROQ_API_KEY" — Private Groq API key.
- "GROQ_MODEL" — Optional model override.

Frontend — Vercel

- "VITE_API_BASE_URL" — Base URL of the deployed backend.

Never commit API keys, passwords, or other secrets to GitHub.

💻 Local Development

Requirements

- Node.js and npm
- A Groq API key

Setup

1. Clone the repository:
   
   git clone https://github.com/Danesh9490/nexora-firetv.git
cd nexora-firetv

2. Install dependencies:
   
   npm install

3. Configure the backend environment variables and start the backend using the project's server configuration.

4. In a separate terminal, start the frontend:
   
   npm run dev

5. Follow the terminal output to open the local development URL.

Check "package.json" for the available scripts and any additional setup requirements.

🧭 Navigation

- Arrow keys: Move focus.
- Enter / OK: Activate the selected control.
- Escape / Backspace: Return to the home screen where supported.

Remote-navigation behavior and compatibility should be verified on the intended Fire TV or Vega OS environment.

🤝 Contributing

Bug reports, improvements, and feature suggestions are welcome.

1. Review existing issues.
2. Describe the proposed change.
3. Submit a pull request with a clear explanation.
4. Test changes before submitting.

🗺️ Roadmap

- Verify Fire TV or Vega OS compatibility.
- Improve accessibility and remote navigation.
- Expand automated tests.
- Add screenshots and a demonstration video.
- Continue improving AI recommendations and planner behavior.

📄 License

This project is licensed under the MIT License. See "LICENSE" (LICENSE).

---

Built to make discovering your next good activity simple.
