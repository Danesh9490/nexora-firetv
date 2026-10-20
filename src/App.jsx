
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
    prompt: 'Teach me one fascinating topic in a beginner-friendly mini lesson. Include a surprising fact, a simple explanation, an everyday example, and three quiz questions.',
  },
  {
    id: 'wellness',
    title: 'Wellness Hub',
    desc: 'Reset your mind and body',
    icon: '🧘',
    color: 'green',
    prompt: 'Guide me through a gentle 5 to 10-minute wellness activity. Include clear steps and a seated alternative. Do not make medical claims.',
  },
  {
    id: 'family',
    title: 'Family Hub',
    desc: 'Make time together count',
    icon: '👨‍👩‍👧‍👦',
    color: 'purple',
    prompt: 'Suggest one inclusive 15-minute family activity that needs little or no equipment. Explain the setup, rules, and how everyone can participate.',
  },
  {
    id: 'brain',
    title: 'Daily Brain',
    desc: 'Puzzles, memory and curiosity',
    icon: '🧠',
    color: 'orange',
    prompt: 'Give me one fair, solvable brain teaser or memory challenge that takes about 5 minutes. Present the challenge first and offer an optional hint.',
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
  { label: 'Relax', prompt: 'Suggest a calming activity I can do in 10 minutes.', icon: '🌿' },
  { label: 'Get energized', prompt: 'Suggest an energizing activity I can do in 10 minutes.', icon: '⚡' },
  { label: 'Be creative', prompt: 'Give me a creative activity that needs no special supplies and takes 15 minutes.', icon: '🎨' },
  { label: 'Brain challenge', prompt: 'Give me one fair, solvable 5-minute brain challenge. Show the challenge first and offer a hint.', icon: '🧩' },
];

const QUICK_IDEAS = [
  { title: 'Relax & Reset', hubId: 'wellness', time: '10 min', icon: '🌿', prompt: 'Suggest a calming 10-minute wellness activity.' },
  { title: 'Family Fun', hubId: 'family', time: '15 min', icon: '🎲', prompt: 'Suggest a fun 15-minute activity for a family with no special equipment.' },
  { title: 'Brain Boost', hubId: 'brain', time: '5 min', icon: '🧠', prompt: 'Give me one enjoyable 5-minute brain challenge. Let me try before showing the answer.' },
  { title: 'Learn Something', hubId: 'learning', time: '10 min', icon: '✨', prompt: 'Teach me one surprising thing in a simple 10-minute mini lesson.' },
];

function renderInline(text, keyPrefix) {
  const cleaned = text.replace(/\\([*_#])/g, '$1');
  const parts = cleaned.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-${index}`}>{part.slice(2, -2)}</strong>;
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

    const numbered = line.match(/^(\d+)[.)]\s+(.*)$/);
    const bullet = line.match(/^[-•*]\s+(.*)$/);

    if (numbered) {
      const items = [];
      while (index < lines.length) {
        const match = lines[index].trim().match(/^(\d+)[.)]\s+(.*)$/);
        if (!match) break;
        items.push(match[2]);
        index += 1;
      }

      blocks.push(
        <ol key={`ol-${index}`}>
          {items.map((item, i) => (
            <li key={`li-${index}-${i}`}>{renderInline(item, `ordered-${index}-${i}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    if (bullet) {
      const items = [];
      while (index < lines.length) {
        const match = lines[index].trim().match(/^[-•*]\s+(.*)$/);
        if (!match) break;
        items.push(match[1]);
        index += 1;
      }

      blocks.push(
        <ul key={`ul-${index}`}>
          {items.map((item, i) => (
            <li key={`bullet-${index}-${i}`}>{renderInline(item, `bullet-${index}-${i}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    const heading = line.match(/^#{1,4}\s+(.*)$/);
    blocks.push(
      <p key={`p-${index}`}>
        {renderInline(heading ? heading[1] : line, `paragraph-${index}`)}
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

  // Planner workflow state
  const [plannerMode, setPlannerMode] = useState(false);
  const [plannerAction, setPlannerAction] = useState('create');
  const [currentPlan, setCurrentPlan] = useState('');

  const mainRef = useRef(null);
  const requestId = useRef(0);

  const openHub = useCallback((hub, initialPrompt = '') => {
    requestId.current += 1;
    setActiveHub(hub);
    setReply('');
    setError('');
    setLoading(false);
    setMessage(initialPrompt);
    setPlannerMode(false);
    setPlannerAction('create');
    setCurrentPlan('');
  }, []);

  const goHome = useCallback(() => {
    requestId.current += 1;
    setActiveHub(null);
    setReply('');
    setError('');
    setLoading(false);
    setMessage('');
    setPlannerMode(false);
    setPlannerAction('create');
    setCurrentPlan('');
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      const target = event.target;
      const isTyping =
        target instanceof HTMLElement &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (event.key === 'Escape' || (event.key === 'Backspace' && !isTyping)) {
        if (activeHub) {
          event.preventDefault();
          goHome();
        }
        return;
      }

      if (
        isTyping ||
        !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)
      ) {
        return;
      }

      const items = Array.from(
        document.querySelectorAll('[data-tv-focus="true"]:not(:disabled)')
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

    setLastPrompt(cleanMessage);
    setLoading(true);
    setReply('');
    setError('');

    try {
      let endpoint = '/api/assistant';
      let body;

      if (plannerMode) {
        endpoint = '/api/planner';

        body = {
          action: plannerAction,
          message: cleanMessage,
          ...(plannerAction === 'revise' ? { currentPlan } : {}),
        };
      } else {
        const hubInstructions = {
          learning: 'Give a learning lesson or educational activity only.',
          wellness: 'Give a gentle wellness or relaxation activity only. Avoid medical claims.',
          family: 'Give an inclusive, family-friendly group activity only.',
          brain: 'Give a brain teaser, puzzle, memory game, or curiosity challenge only.',
          assistant: 'Choose the most suitable activity based on the user request.',
        };

        const fullPrompt = [
          `You are Nexora AI inside the ${selectedHub.title}.`,
          hubInstructions[selectedHub.id] || '',
          'Use clear headings, short paragraphs, and numbered steps when useful.',
          'Use plain text without literal backslashes before formatting symbols.',
          `User request: ${cleanMessage}`,
        ].filter(Boolean).join('\n\n');

        body = { message: fullPrompt };
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'The AI request failed.');
      }

      if (thisRequest !== requestId.current) return;

      const answer =
        typeof data.reply === 'string' && data.reply.trim()
          ? data.reply.trim()
          : '';

      if (!answer) {
        throw new Error('The AI returned an empty answer. Please try again.');
      }

      setReply(answer);

      if (plannerMode && /^STATUS:\s*PLAN\b/im.test(answer)) {
        setCurrentPlan(answer);
        setPlannerAction('revise');
      }
    } catch (err) {
      if (thisRequest === requestId.current) {
        setError(err.message || 'Could not connect to Nexora AI. Please try again.');
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
    setMessage(`Give me a different suggestion. My previous request was: ${lastPrompt}`);
    setReply('');
    setError('');
    if (plannerMode) {
      setPlannerAction('create');
    }
  }

  function enablePlanner() {
    setPlannerMode(true);
    setPlannerAction('create');
    setReply('');
    setError('');
    setMessage('');
  }

  function disablePlanner() {
    setPlannerMode(false);
    setReply('');
    setError('');
    setMessage('');
  }

  function startRevision() {
    if (!currentPlan) return;
    setPlannerAction('revise');
    setReply('');
    setError('');
    setMessage('Improve this plan and make it more suitable for me.');
    document.querySelector('[data-prompt-input]')?.focus();
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
          aria-label="Nexora home"
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
              <h1>A smarter way to <span>spend your screen time.</span></h1>
              <p className="intro">
                Learn, reset, connect, and keep your mind sharp with a colorful
                experience for your whole room.
              </p>
              <p className="remote-tip">
                <span>← ↑ ↓ →</span> Navigate <span>OK / ENTER</span> Select <span>ESC</span> Back
              </p>
            </section>

            <section className="hub-grid" aria-label="Nexora hubs">
              {HUBS.map((hub, index) => (
                <button
                  className={`hub-card ${hub.color} ${focusedIndex === index ? 'selected' : ''}`}
                  key={hub.id}
                  type="button"
                  data-tv-focus="true"
                  data-hub-card
                  onFocus={() => setFocusedIndex(index)}
                  onClick={() => openHub(hub, hub.prompt)}
                  aria-label={`Open ${hub.title}: ${hub.desc}`}
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
                    className="quick-card"
                    key={idea.title}
                    type="button"
                    data-tv-focus="true"
                    onClick={() => openHubWithPrompt(idea.hubId, idea.prompt)}
                  >
                    <span className="quick-icon">{idea.icon}</span>
                    <span className="quick-title">{idea.title}</span>
                    <span className="quick-meta">{idea.time} · {HUBS.find((hub) => hub.id === idea.hubId)?.title}</span>
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
              <div className="assistant-main panel">
                <p className="eyebrow">
                  {plannerMode ? 'PLAN · ADAPT · IMPROVE' : 'YOUR PERSONAL ACTIVITY GUIDE'}
                </p>

                <h2>
                  {plannerMode
                    ? 'Let’s plan your next activity'
                    : activeHub.id === 'learning'
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
                  {plannerMode
                    ? 'Create a structured activity plan, then ask Nexora to revise it using your feedback.'
                    : 'Choose a suggestion or ask Nexora AI for a personalized activity. Tell us how much time you have.'}
                </p>

                {activeHub.id === 'assistant' && (
                  <div className="mood-row" aria-label="Choose AI mode">
                    {!plannerMode ? (
                      <button
                        type="button"
                        className="mood-chip"
                        data-tv-focus="true"
                        onClick={enablePlanner}
                      >
                        🗺️ Activity Planner
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="mood-chip"
                        data-tv-focus="true"
                        onClick={disablePlanner}
                      >
                        ← Standard AI
                      </button>
                    )}
                  </div>
                )}

                {plannerMode && (
                  <div className="planner-controls">
                    <p className="eyebrow">PLANNER ACTION</p>
                    <div className="mood-row">
                      <button
                        type="button"
                        className="mood-chip"
                        data-tv-focus="true"
                        disabled={loading}
                        onClick={() => {
                          setPlannerAction('create');
                          setError('');
                          setMessage('');
                        }}
                      >
                        ✨ Create a plan
                      </button>
                      <button
                        type="button"
                        className="mood-chip"
                        data-tv-focus="true"
                        disabled={loading || !currentPlan}
                        onClick={startRevision}
                      >
                        🔄 Revise current plan
                      </button>
                    </div>
                    <p className="panel-copy">
                      Current action: <strong>{plannerAction === 'create' ? 'Create plan' : 'Revise plan'}</strong>
                      {!currentPlan && ' · Create a plan before revising it.'}
                    </p>
                  </div>
                )}

                {!plannerMode && (
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
                )}

                <form className="ask-form" onSubmit={askAI}>
                  <label htmlFor="nexora-prompt">
                    {plannerMode
                      ? plannerAction === 'create'
                        ? 'Describe the activity you want to plan'
                        : 'How should Nexora revise the plan?'
                      : 'Your request'}
                  </label>

                  <div className="input-row">
                    <input
                      id="nexora-prompt"
                      data-prompt-input
                      data-tv-focus="true"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder={
                        plannerMode
                          ? plannerAction === 'create'
                            ? 'e.g. Plan a 10-minute family game...'
                            : 'e.g. Make it easier and remove extra materials...'
                          : "Tell Nexora what you'd like to do..."
                      }
                      autoComplete="off"
                      disabled={loading}
                    />
                    <button
                      className="primary-button"
                      type="submit"
                      data-tv-focus="true"
                      disabled={
                        loading ||
                        !message.trim() ||
                        (plannerMode && plannerAction === 'revise' && !currentPlan)
                      }
                    >
                      {loading ? 'Thinking…' : plannerMode ? 'Run Planner' : 'Ask AI'}
                      {' '}<span aria-hidden="true">→</span>
                    </button>
                  </div>
                </form>

                {loading && (
                  <div className="status panel-message" role="status">
                    <span className="spinner" />
                    {plannerMode ? 'Nexora is working on your plan…' : 'Nexora is preparing your suggestion. This may take a moment.'}
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
                        <p className="eyebrow">
                          {plannerMode ? 'ACTIVITY PLANNER RESULT' : 'YOUR NEXT GOOD THING'}
                        </p>
                        <h3>
                          {plannerMode
                            ? /^STATUS:\s*QUESTION\b/im.test(reply)
                              ? 'One quick question'
                              : 'Your activity plan'
                            : 'Nexora recommends'}
                        </h3>
                      </div>
                    </div>

                    <FormattedReply text={reply} />

                    {plannerMode && /^STATUS:\s*PLAN\b/im.test(reply) && (
                      <p className="panel-copy">
                        Your plan is available to revise during this session. Choose “Revise current plan” to adapt it.
                      </p>
                    )}

                    <div className="recommendation-actions">
                      <button
                        type="button"
                        data-tv-focus="true"
                        className="secondary-button"
                        onClick={askForAnotherIdea}
                      >
                        {plannerMode ? 'Create another plan ↻' : 'Another idea ↻'}
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
                <p className="eyebrow">
                  {plannerMode ? 'YOUR PLAN, YOUR WAY' : 'MADE FOR YOUR MOMENT'}
                </p>
                <h3>{plannerMode ? 'Make a good idea actionable.' : 'Small activities. Better breaks.'}</h3>

                <ul className="benefit-list">
                  {plannerMode ? (
                    <>
                      <li>Create structured activity plans</li>
                      <li>Answer a clarifying question when needed</li>
                      <li>Revise the current plan with feedback</li>
                      <li>Keep the plan available during this session</li>
                    </>
                  ) : (
                    <>
                      <li>Suggestions matched to your chosen hub</li>
                      <li>Short activities with clear steps</li>
                      <li>Learn, relax, connect, and grow</li>
                      <li>AI-powered activity ideas</li>
                    </>
                  )}
                </ul>

                <div className="privacy-note">
                  <span>🔒</span>
                  <p>
                    <strong>Hosted AI service</strong>
                    <br />
                    Your prompt is sent to Nexora's backend for processing by the AI provider.
                  </p>
                </div>
              </aside>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <span className="footer-brand">NEXORA <span>Fire TV</span></span>
        <span>Learn · Relax · Connect · Grow</span>
        <span>Responsive web experience</span>
      </footer>
    </div>
  );
}
