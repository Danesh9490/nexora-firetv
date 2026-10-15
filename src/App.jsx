
import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const HUBS = [
  {
    id: 'learning',
    title: 'Learning Hub',
    desc: 'Learn something new in minutes',
    icon: '🎓',
    color: 'blue',
    prompt:
      'Teach me one fascinating topic in a beginner-friendly 10-minute mini lesson. Explain it simply, give an everyday example, and finish with three quiz questions before showing the answers.',
  },
  {
    id: 'wellness',
    title: 'Wellness Hub',
    desc: 'Reset your mind and body',
    icon: '🧘',
    color: 'green',
    prompt:
      'Guide me through a gentle 5-minute wellness break. Give clear steps for breathing, relaxing, or gentle movement. Include a seated alternative and remind me to stop if uncomfortable. Do not make medical claims.',
  },
  {
    id: 'family',
    title: 'Family Hub',
    desc: 'Make time together count',
    icon: '👨‍👩‍👧‍👦',
    color: 'purple',
    prompt:
      'Suggest a fun, inclusive 15-minute family activity needing little or no equipment. Explain the setup, rules, and how people of different ages can participate.',
  },
  {
    id: 'brain',
    title: 'Daily Brain',
    desc: 'Puzzles, memory and curiosity',
    icon: '🧠',
    color: 'orange',
    prompt:
      'Give me one fair, solvable 5-minute brain teaser. Show the challenge first and offer an optional hint. Do not reveal the answer unless I ask.',
  },
  {
    id: 'assistant',
    title: 'Nexora AI',
    desc: 'Your personal activity guide',
    icon: '🤖',
    color: 'cyan',
    prompt: '',
  },
];

const MOODS = [
  { label: 'Relax', icon: '🌿', prompt: 'Suggest a calming 10-minute activity.' },
  { label: 'Get energized', icon: '⚡', prompt: 'Suggest a safe, energizing activity I can do in 10 minutes.' },
  { label: 'Be creative', icon: '🎨', prompt: 'Give me a creative activity that takes 15 minutes and needs no special supplies.' },
  { label: 'Brain challenge', icon: '🧩', prompt: 'Give me one 5-minute brain teaser. Do not reveal the answer unless I ask.' },
];

const QUICK_IDEAS = [
  { title: 'Relax & Reset', hub: 'Wellness Hub', time: '10 min', icon: '🌿', prompt: 'Suggest a calming 10-minute wellness activity.' },
  { title: 'Family Fun', hub: 'Family Hub', time: '15 min', icon: '🎲', prompt: 'Suggest a fun 15-minute family activity with no special equipment.' },
  { title: 'Brain Boost', hub: 'Daily Brain', time: '5 min', icon: '🧠', prompt: 'Give me one enjoyable 5-minute brain challenge. Let me try before showing the answer.' },
  { title: 'Learn Something', hub: 'Learning Hub', time: '10 min', icon: '✨', prompt: 'Teach me one surprising thing in a simple 10-minute mini lesson.' },
];

export default function App() {
  const [activeHub, setActiveHub] = useState(null);
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastPrompt, setLastPrompt] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const requestId = useRef(0);
  const mainRef = useRef(null);

  const openHub = useCallback((hub) => {
    requestId.current += 1;
    setActiveHub(hub);
    setMessage('');
    setReply('');
    setError('');
    setLoading(false);
  }, []);

  const openHubWithPrompt = useCallback((prompt) => {
    requestId.current += 1;
    setActiveHub(HUBS[4]);
    setMessage(prompt);
    setReply('');
    setError('');
    setLoading(false);
  }, []);

  const goHome = useCallback(() => {
    requestId.current += 1;
    setActiveHub(null);
    setMessage('');
    setReply('');
    setError('');
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;
      const typing = target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
         target.tagName === 'TEXTAREA' ||
         target.isContentEditable);

      if (event.key === 'Escape' || (event.key === 'Backspace' && !typing)) {
        if (activeHub) {
          event.preventDefault();
          goHome();
        }
        return;
      }

      if (typing || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        return;
      }

      const items = Array.from(
        document.querySelectorAll('[data-tv-focus="true"]:not(:disabled)')
      ).filter((item) => item.getClientRects().length > 0);

      if (!items.length) return;

      const current = document.activeElement;
      if (!items.includes(current)) {
        event.preventDefault();
        items[0].focus();
        return;
      }

      const rect = current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const direction = event.key;
      let best = null;
      let bestScore = Infinity;

      items.forEach((item) => {
        if (item === current) return;

        const r = item.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        const dx = x - cx;
        const dy = y - cy;

        const forward =
          direction === 'ArrowRight' ? dx :
          direction === 'ArrowLeft' ? -dx :
          direction === 'ArrowDown' ? dy : -dy;

        if (forward <= 2) return;

        const cross = direction === 'ArrowLeft' || direction === 'ArrowRight'
          ? Math.abs(dy)
          : Math.abs(dx);

        const score = forward + cross * 2.2;
        if (score < bestScore) {
          bestScore = score;
          best = item;
        }
      });

      if (best) {
        event.preventDefault();
        best.focus();
        best.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeHub, goHome]);

  useEffect(() => {
    const selector = activeHub
      ? '[data-back-button]'
      : '[data-hub-card]';

    const first = mainRef.current?.querySelector(selector);
    first?.focus();
  }, [activeHub]);

  async function askAI(event) {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (!cleanMessage || loading) return;

    const currentRequest = ++requestId.current;
    setLastPrompt(cleanMessage);
    setLoading(true);
    setReply('');
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: cleanMessage }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status}).`);
      }

      if (currentRequest === requestId.current) {
        setReply(data.reply || 'No suggestion was returned. Please try another prompt.');
      }
    } catch (err) {
      if (currentRequest === requestId.current) {
        setError(err.message || 'Could not connect to Nexora AI. Check your backend configuration.');
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }

  function usePrompt(prompt) {
    setMessage(prompt);
    setError('');
    document.querySelector('[data-prompt-input]')?.focus();
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={goHome} aria-label="Nexora home">
          NEXORA <span>FIRE TV</span>
        </button>
        <div className="topbar-right">
          <span className="live-dot" />
          <span>AI ACTIVITY HUB</span>
        </div>
      </header>

      <main ref={mainRef}>
        {!activeHub ? (
          <>
            <section className="hero-copy">
              <p className="eyebrow">YOUR TIME, WELL SPENT</p>
              <h1>A smarter way to <span>spend your screen time.</span></h1>
              <p className="intro">
                Learn, reset, connect, and keep your mind sharp with a colorful
                experience for your whole room.
              </p>
              <p className="remote-tip">
                <span>← ↑ ↓ →</span> Navigate <span>OK / ENTER</span> Select
                <span>ESC</span> Back
              </p>
            </section>

            <section className="hub-grid" aria-label="Nexora hubs">
              {HUBS.map((hub, index) => (
                <button
                  key={hub.id}
                  type="button"
                  className={`hub-card ${hub.color} ${focusedIndex === index ? 'selected' : ''}`}
                  data-tv-focus="true"
                  data-hub-card
                  onFocus={() => setFocusedIndex(index)}
                  onClick={() => openHub(hub)}
                  aria-label={`Open ${hub.title}`}
                >
                  <span className="hub-icon" aria-hidden="true">{hub.icon}</span>
                  <span className="hub-title">{hub.title}</span>
                  <span className="hub-desc">{hub.desc}</span>
                  <span className="card-open">Explore <span aria-hidden="true">↗</span></span>
                </button>
              ))}
            </section>

            <section className="quick-section">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">A GOOD PLACE TO START</p>
                  <h2>Quick picks</h2>
                </div>
                <p>Choose an idea to ask Nexora AI</p>
              </div>
              <div className="quick-grid">
                {QUICK_IDEAS.map((idea) => (
                  <button
                    key={idea.title}
                    className="quick-card"
                    type="button"
                    data-tv-focus="true"
                    onClick={() => openHubWithPrompt(idea.prompt)}
                  >
                    <span className="quick-icon">{idea.icon}</span>
                    <span className="quick-title">{idea.title}</span>
                    <span className="quick-meta">{idea.time} · {idea.hub}</span>
                    <span className="quick-arrow">Ask Nexora ↗</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="hub-view">
            <button
              className="back-button"
              type="button"
              data-tv-focus="true"
              data-back-button
              onClick={goHome}
            >
              ← <span>Back to Home</span>
            </button>

            <div className="view-heading">
              <div className={`large-hub-icon ${activeHub.color}`}>{activeHub.icon}</div>
              <div>
                <p className="eyebrow">NEXORA EXPERIENCE</p>
                <h1>{activeHub.title}</h1>
                <p className="intro">{activeHub.desc}</p>
              </div>
            </div>

            <div className="assistant-layout">
              <section className="assistant-main panel">
                <p className="eyebrow">YOUR PERSONAL ACTIVITY GUIDE</p>
                <h2>{activeHub.id === 'assistant' ? 'What are you in the mood for?' : 'Ready to get started?'}</h2>
                <p className="panel-copy">
                  Choose a suggestion or ask Nexora AI for a personalized activity.
                  Keep requests simple and tell us how much time you have.
                </p>

                <div className="mood-row" aria-label="Quick prompts">
                  {MOODS.map((mood) => (
                    <button
                      key={mood.label}
                      type="button"
                      className="mood-chip"
                      data-tv-focus="true"
                      onClick={() => usePrompt(mood.prompt)}
                    >
                      {mood.icon} {mood.label}
                    </button>
                  ))}
                </div>

                <form className="ask-form" onSubmit={askAI}>
                  <label htmlFor="nexora-prompt">Your request</label>
                  <div className="input-row">
                    <input
                      id="nexora-prompt"
                      data-prompt-input
                      data-tv-focus="true"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder="What would you like to do?"
                      autoComplete="off"
                      disabled={loading}
                    />
                    <button
                      className="primary-button"
                      type="submit"
                      data-tv-focus="true"
                      disabled={loading || !message.trim()}
                    >
                      {loading ? 'Thinking…' : 'Ask AI →'}
                    </button>
                  </div>
                </form>

                {loading && (
                  <div className="status panel-message" role="status" aria-live="polite">
                    <span className="spinner" />
                    Nexora is preparing your suggestion…
                  </div>
                )}

                {error && (
                  <div className="error-message" role="alert">
                    <strong>Couldn't reach Nexora AI</strong>
                    <p>{error}</p>
                    <button
                      type="button"
                      className="text-button"
                      data-tv-focus="true"
                      onClick={() => usePrompt(lastPrompt || message)}
                    >
                      Try again
                    </button>
                  </div>
                )}

                {reply && (
                  <section className="recommendation" aria-live="polite">
                    <div className="recommendation-title">
                      <span className="bot-icon">✦</span>
                      <div>
                        <p className="eyebrow">YOUR NEXT GOOD THING</p>
                        <h3>Nexora recommends</h3>
                      </div>
                    </div>
                    <p className="recommendation-text">{reply}</p>
                    <div className="recommendation-actions">
                      <button
                        type="button"
                        data-tv-focus="true"
                        className="secondary-button"
                        onClick={() => {
                          const nextPrompt = `Give me a different suggestion for: ${lastPrompt}`;
                          setMessage(nextPrompt);
                          setReply('');
                          setError('');
                        }}
                      >
                        Another idea ↻
                      </button>
                      <button
                        type="button"
                        data-tv-focus="true"
                        className="text-button"
                        onClick={() => { setReply(''); setError(''); }}
                      >
                        Clear result
                      </button>
                    </div>
                  </section>
                )}
              </section>

              <aside className="assistant-aside panel">
                <div className="aside-orb">✦</div>
                <p className="eyebrow">MADE FOR YOUR MOMENT</p>
                <h3>Small activities. Better breaks.</h3>
                <ul className="benefit-list">
                  <li>Suggestions matched to your mood</li>
                  <li>Short activities with clear steps</li>
                  <li>Learning, wellness, family and puzzles</li>
                  <li>AI-powered activity ideas</li>
                </ul>
                <div className="privacy-note">
                  <span>🔒</span>
                  <p>
                    <strong>Hosted AI service</strong>
                    Your prompt is sent to the Nexora backend and AI provider.
                    Do not enter passwords or sensitive personal information.
                  </p>
                </div>
              </aside>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <span className="footer-brand">NEXORA <span>FIRE TV</span></span>
        <span>Learn · Relax · Connect · Grow</span>
        <span>Responsive web experience</span>
      </footer>
    </div>
  );
}
