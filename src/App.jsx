
import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(
  /\/$/,
  ''
);

const HUBS = [
  {
    id: 'learning',
    title: 'Learning Hub',
    desc: 'Learn something new in minutes',
    icon: '🎓',
    color: 'blue',
    prompt:
      'Teach me one fascinating topic in a beginner-friendly 10-minute mini lesson. Include a surprising fact, a simple explanation, an everyday example, and three quiz questions. Show the questions before the answers.',
  },
  {
    id: 'wellness',
    title: 'Wellness Hub',
    desc: 'Reset your mind and body',
    icon: '🧘',
    color: 'green',
    prompt:
      'Guide me through a gentle 5 to 10-minute wellness activity. Give clear steps for relaxing, mindful breathing, or gentle movement. Include a seated alternative and remind me to stop if I feel uncomfortable. Do not make medical claims.',
  },
  {
    id: 'family',
    title: 'Family Hub',
    desc: 'Make time together count',
    icon: '👨‍👩‍👧‍👦',
    color: 'purple',
    prompt:
      'Suggest one fun, inclusive 15-minute family activity that needs little or no equipment. Explain the setup, rules, and how everyone can participate. Keep it family-friendly for different ages.',
  },
  {
    id: 'brain',
    title: 'Daily Brain',
    desc: 'Puzzles, memory and curiosity',
    icon: '🧠',
    color: 'orange',
    prompt:
      'Give me one fair, solvable brain teaser or memory challenge that takes about 5 minutes. Present the challenge first and offer an optional hint. Do not reveal the answer unless I ask.',
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
  {
    label: 'Relax',
    prompt: 'Suggest a calming activity I can do in 10 minutes.',
    icon: '🌿',
  },
  {
    label: 'Get energized',
    prompt: 'Suggest an energizing activity I can do in 10 minutes.',
    icon: '⚡',
  },
  {
    label: 'Be creative',
    prompt:
      'Give me a creative activity that needs no special supplies and takes 15 minutes.',
    icon: '🎨',
  },
  {
    label: 'Brain challenge',
    prompt:
      'Give me one fair, solvable 5-minute brain challenge. Show the challenge first and offer a hint without revealing the answer.',
    icon: '🧩',
  },
];

const QUICK_IDEAS = [
  {
    title: 'Relax & Reset',
    hub: 'Wellness Hub',
    hubId: 'wellness',
    time: '10 min',
    icon: '🌿',
    prompt: 'Suggest a calming 10-minute wellness activity.',
  },
  {
    title: 'Family Fun',
    hub: 'Family Hub',
    hubId: 'family',
    time: '15 min',
    icon: '🎲',
    prompt:
      'Suggest a fun 15-minute activity for a family with no special equipment.',
  },
  {
    title: 'Brain Boost',
    hub: 'Daily Brain',
    hubId: 'brain',
    time: '5 min',
    icon: '🧠',
    prompt:
      'Give me one enjoyable 5-minute brain challenge. Let me try before showing the answer.',
  },
  {
    title: 'Learn Something',
    hub: 'Learning Hub',
    hubId: 'learning',
    time: '10 min',
    icon: '✨',
    prompt:
      'Teach me one surprising thing in a simple 10-minute mini lesson.',
  },
];

// Render AI text as React elements, never as HTML.
// Supports bold text, headings, numbered lists and bullet lists.
function renderInline(text, keyPrefix) {
  const cleaned = text.replace(/\\([*_#])/g, '$1');
  const parts = cleaned.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${keyPrefix}-${index}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    return part;
  });
}

function FormattedReply({ text }) {
  const lines = String(text || '')
    .replace(/\r\n?/g, '\n')
    .trim()
    .split('\n');

  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    const numbered = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
    const bullet = line.match(/^\s*[-•*]\s+(.*)$/);

    if (numbered) {
      const items = [];

      while (index < lines.length) {
        const match = lines[index]
          .trim()
          .match(/^(\d+)[.)]\s+(.*)$/);

        if (!match) break;

        items.push({
          number: match[1],
          text: match[2],
        });
        index += 1;
      }

      blocks.push(
        <ol key={`ol-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={`li-${index}-${itemIndex}`}>
              {renderInline(item.text, `ordered-${index}-${itemIndex}`)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (bullet) {
      const items = [];

      while (index < lines.length) {
        const match = lines[index]
          .trim()
          .match(/^[-•*]\s+(.*)$/);

        if (!match) break;

        items.push(match[1]);
        index += 1;
      }

      blocks.push(
        <ul key={`ul-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={`bullet-${index}-${itemIndex}`}>
              {renderInline(item, `bullet-${index}-${itemIndex}`)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    const heading = line.match(/^#{1,4}\s+(.*)$/);
    const content = heading ? heading[1] : line;

    blocks.push(
      <p key={`p-${index}`}>
        {renderInline(content, `paragraph-${index}`)}
      </p>
    );

    index += 1;
  }

  return <div className="recommendation-text">{blocks}</div>;
}

export default function App() {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [activeHub, setActiveHub] = useState(null);
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastPrompt, setLastPrompt] = useState('');

  const mainRef = useRef(null);
  const requestId = useRef(0);

  const openHub = useCallback((hub, initialPrompt = '') => {
    requestId.current += 1;
    setActiveHub(hub);
    setReply('');
    setError('');
    setLoading(false);
    setMessage(initialPrompt);
  }, []);

  const goHome = useCallback(() => {
    requestId.current += 1;
    setActiveHub(null);
    setReply('');
    setError('');
    setLoading(false);
    setMessage('');
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      const target = event.target;

      const isTyping =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (
        event.key === 'Escape' ||
        (event.key === 'Backspace' && !isTyping)
      ) {
        if (activeHub) {
          event.preventDefault();
          goHome();
        }
        return;
      }

      if (
        isTyping ||
        !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(
          event.key
        )
      ) {
        return;
      }

      const items = Array.from(
        document.querySelectorAll(
          '[data-tv-focus="true"]:not(:disabled)'
        )
      ).filter((element) => element.getClientRects().length > 0);

      if (!items.length) return;

      const current = items.indexOf(document.activeElement);
      let next = current < 0 ? 0 : current;

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        next = (next + 1) % items.length;
      } else {
        next = (next - 1 + items.length) % items.length;
      }

      event.preventDefault();
      items[next].focus();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeHub, goHome]);

  useEffect(() => {
    if (!activeHub) {
      const cards = mainRef.current?.querySelectorAll('[data-hub-card]');
      cards?.[focusedIndex]?.focus();
    } else {
      mainRef.current?.querySelector('[data-back-button]')?.focus();
    }
  }, [activeHub, focusedIndex]);

  async function askAI(event) {
    event.preventDefault();

    const cleanMessage = message.trim();

    if (!cleanMessage || loading || !activeHub) return;

    const thisRequest = ++requestId.current;
    const selectedHub = activeHub;

    const hubInstructions = {
      learning:
        'Give a learning lesson or educational activity only. Do not substitute a wellness exercise, family game, or unrelated activity.',
      wellness:
        'Give a gentle wellness, relaxation, breathing, or movement activity only. Avoid medical claims.',
      family:
        'Give an inclusive, family-friendly group activity only.',
      brain:
        'Give a brain teaser, puzzle, memory game, or curiosity challenge only.',
      assistant:
        'Choose the most suitable activity based on the user request.',
    };

    const fullPrompt = [
      `You are Nexora AI inside the ${selectedHub.title}.`,
      hubInstructions[selectedHub.id] || '',
      'Respond in readable plain text or Markdown.',
      'Use clear headings, short paragraphs, and numbered steps when useful.',
      'Do not include literal backslashes before Markdown symbols.',
      `User request: ${cleanMessage}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    setLastPrompt(cleanMessage);
    setLoading(true);
    setReply('');
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: fullPrompt,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'The AI request failed.');
      }

      if (thisRequest === requestId.current) {
        setReply(
          typeof data.reply === 'string' && data.reply.trim()
            ? data.reply
            : 'I could not create a suggestion. Please try another prompt.'
        );
      }
    } catch (err) {
      if (thisRequest === requestId.current) {
        setError(
          err.message ||
            'Could not connect to Nexora AI. Please check the backend configuration.'
        );
      }
    } finally {
      if (thisRequest === requestId.current) {
        setLoading(false);
      }
    }
  }

  function usePrompt(prompt) {
    setMessage(prompt);
    setError('');
    document.querySelector('[data-prompt-input]')?.focus();
  }

  function openHubWithPrompt(hubId, prompt) {
    const hub = HUBS.find((item) => item.id === hubId) || HUBS[4];
    openHub(hub, prompt);
  }

  function askForAnotherIdea() {
    setMessage(
      `Give me a different suggestion. My previous request was: ${lastPrompt}`
    );
    setReply('');
    setError('');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            goHome();
          }}
          aria-label="Nexora Fire TV home"
        >
          NEXORA <span>Fire TV</span>
        </a>

        <div className="topbar-right">
          <span className="live-dot" /> NEXORA AI
        </div>
      </header>

      <main ref={mainRef}>
        {!activeHub ? (
          <>
            <section className="hero-copy">
              <p className="eyebrow">YOUR TIME, WELL SPENT</p>

              <h1>
                A smarter way to <span>spend your screen time.</span>
              </h1>

              <p className="intro">
                Learn, reset, connect, and keep your mind sharp with a
                colorful experience for your whole room.
              </p>

              <p className="remote-tip">
                <span>← ↑ ↓ →</span> Navigate{' '}
                <span>OK / ENTER</span> Select <span>ESC</span> Back
              </p>
            </section>

            <section className="hub-grid" aria-label="Nexora hubs">
              {HUBS.map((hub, index) => (
                <button
                  className={`hub-card ${hub.color} ${
                    focusedIndex === index ? 'selected' : ''
                  }`}
                  key={hub.id}
                  type="button"
                  data-tv-focus="true"
                  data-hub-card
                  onFocus={() => setFocusedIndex(index)}
                  onClick={() => openHub(hub, hub.prompt)}
                  aria-label={`Open ${hub.title}: ${hub.desc}`}
                >
                  <span className="hub-icon" aria-hidden="true">
                    {hub.icon}
                  </span>
                  <span className="hub-title">{hub.title}</span>
                  <span className="hub-desc">{hub.desc}</span>
                  <span className="card-open">
                    Explore <span aria-hidden="true">↗</span>
                  </span>
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
                    className="quick-card"
                    key={idea.title}
                    type="button"
                    data-tv-focus="true"
                    onClick={() =>
                      openHubWithPrompt(idea.hubId, idea.prompt)
                    }
                  >
                    <span className="quick-icon">{idea.icon}</span>
                    <span className="quick-title">{idea.title}</span>
                    <span className="quick-meta">
                      {idea.time} · {idea.hub}
                    </span>
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
              <div className={`large-hub-icon ${activeHub.color}`}>
                {activeHub.icon}
              </div>
              <div>
                <p className="eyebrow">NEXORA EXPERIENCE</p>
                <h1>{activeHub.title}</h1>
                <p className="intro">{activeHub.desc}</p>
              </div>
            </div>

            <div className="assistant-layout">
              <div className="assistant-main panel">
                <p className="eyebrow">YOUR PERSONAL ACTIVITY GUIDE</p>

                <h2>
                  {activeHub.id === 'learning'
                    ? 'What would you like to learn?'
                    : activeHub.id === 'wellness'
                      ? 'How would you like to reset?'
                      : activeHub.id === 'family'
                        ? 'Ready for family fun?'
                        : activeHub.id === 'brain'
                          ? 'Ready to challenge your mind?'
                          : 'What are you in the mood for?'}
                </h2>

                <p className="panel-copy">
                  Choose a suggestion or ask Nexora AI for a personalized
                  activity. Tell us how much time you have.
                </p>

                <div className="mood-row" aria-label="Quick suggestions">
                  {MOODS.map((mood) => (
                    <button
                      type="button"
                      className="mood-chip"
                      key={mood.label}
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
                      placeholder="Tell Nexora what you'd like to do..."
                      autoComplete="off"
                      disabled={loading}
                    />

                    <button
                      className="primary-button"
                      type="submit"
                      data-tv-focus="true"
                      disabled={loading || !message.trim()}
                    >
                      {loading ? 'Thinking…' : 'Ask AI'}{' '}
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </form>

                {loading && (
                  <div className="status panel-message" role="status">
                    <span className="spinner" />
                    Nexora is preparing your suggestion. This may take a
                    moment.
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
                      Restore request
                    </button>
                  </div>
                )}

                {reply && (
                  <div className="recommendation" aria-live="polite">
                    <div className="recommendation-title">
                      <span className="bot-icon">✦</span>
                      <div>
                        <p className="eyebrow">YOUR NEXT GOOD THING</p>
                        <h3>Nexora recommends</h3>
                      </div>
                    </div>

                    <FormattedReply text={reply} />

                    <div className="recommendation-actions">
                      <button
                        type="button"
                        data-tv-focus="true"
                        className="secondary-button"
                        onClick={askForAnotherIdea}
                      >
                        Another idea ↻
                      </button>

                      <button
                        type="button"
                        data-tv-focus="true"
                        className="text-button"
                        onClick={() => {
                          setReply('');
                          setError('');
                        }}
                      >
                        Clear result
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <aside className="assistant-aside panel">
                <div className="aside-orb">✦</div>

                <p className="eyebrow">MADE FOR YOUR MOMENT</p>
                <h3>Small activities. Better breaks.</h3>

                <ul className="benefit-list">
                  <li>Suggestions matched to your chosen hub</li>
                  <li>Short activities with clear steps</li>
                  <li>Learn, relax, connect, and grow</li>
                  <li>AI-powered activity ideas</li>
                </ul>

                <div className="privacy-note">
                  <span>🔒</span>
                  <p>
                    <strong>Hosted AI service</strong>
                    <br />
                    Your prompt is sent to Nexora's backend for processing
                    by the AI provider.
                  </p>
                </div>
              </aside>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <span className="footer-brand">
          NEXORA <span>Fire TV</span>
        </span>
        <span>Learn · Relax · Connect · Grow</span>
        <span>Responsive web experience</span>
      </footer>
    </div>
  );
}
