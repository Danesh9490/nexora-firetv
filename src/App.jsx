import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';

const HUBS = [
  { id: 'learning', title: 'Learning Hub', desc: 'Learn something new in minutes', icon: '🎓', color: 'blue' },
  { id: 'wellness', title: 'Wellness Hub', desc: 'Reset your mind and body', icon: '🧘', color: 'green' },
  { id: 'family', title: 'Family Hub', desc: 'Make time together count', icon: '👨‍👩‍👧‍👦', color: 'purple' },
  { id: 'brain', title: 'Daily Brain', desc: 'Puzzles, memory and curiosity', icon: '🧠', color: 'orange' },
  { id: 'assistant', title: 'Nexora AI', desc: 'Personalized activity ideas', icon: '🤖', color: 'cyan' },
];

const MOODS = [
  { label: 'Relax', prompt: 'I want to relax for 10 minutes.', icon: '🌿' },
  { label: 'Get energized', prompt: 'Suggest an energetic activity I can do in 10 minutes.', icon: '⚡' },
  { label: 'Be creative', prompt: 'Give me a creative activity that needs no special supplies and takes 15 minutes.', icon: '🎨' },
  { label: 'Brain challenge', prompt: 'Give me a fun brain challenge that takes 5 minutes. Include the challenge, but put the answer under a separate spoiler-style answer line.', icon: '🧩' },
];

const QUICK_IDEAS = [
  { title: 'Relax & Reset', hub: 'Wellness Hub', time: '10 min', icon: '🌿', prompt: 'I want a calming 10-minute wellness activity.' },
  { title: 'Family Fun', hub: 'Family Hub', time: '15 min', icon: '🎲', prompt: 'Suggest a fun 15-minute activity for a family with no special equipment.' },
  { title: 'Brain Boost', hub: 'Daily Brain', time: '5 min', icon: '🧠', prompt: 'Give me one enjoyable 5-minute brain challenge. Let me try before showing the answer.' },
  { title: 'Learn Something', hub: 'Learning Hub', time: '10 min', icon: '✨', prompt: 'Teach me one surprising thing in a simple 10-minute mini lesson.' },
];

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

  const openHub = useCallback((hub) => {
    setActiveHub(hub);
    setReply('');
    setError('');
    setMessage('');
  }, []);

  const goHome = useCallback(() => {
    requestId.current += 1;
    setActiveHub(null);
    setReply('');
    setError('');
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;
      const isTyping = target instanceof HTMLElement &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (event.key === 'Escape' || (event.key === 'Backspace' && !isTyping)) {
        if (activeHub) {
          event.preventDefault();
          goHome();
        }
        return;
      }

      if (isTyping || !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;

      const items = Array.from(document.querySelectorAll('[data-tv-focus="true"]:not(:disabled)'))
        .filter((el) => el.getClientRects().length > 0);
      if (!items.length) return;

      const current = items.indexOf(document.activeElement);
      let next = current < 0 ? 0 : current;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (next + 1) % items.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (next - 1 + items.length) % items.length;
      event.preventDefault();
      items[next].focus();
    };

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
    if (!cleanMessage || loading) return;

    const thisRequest = ++requestId.current;
    setLastPrompt(cleanMessage);
    setLoading(true);
    setReply('');
    setError('');

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: cleanMessage }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'The AI request failed.');
      if (thisRequest === requestId.current) setReply(data.reply || 'I could not create a suggestion. Try another prompt.');
    } catch (err) {
      if (thisRequest === requestId.current) {
        setError(err.message || 'Could not connect to Nexora AI. Check that the backend and Ollama are running.');
      }
    } finally {
      if (thisRequest === requestId.current) setLoading(false);
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
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); goHome(); }} aria-label="Nexora Fire TV home">
          NEXORA <span>Fire TV</span>
        </a>
        <div className="topbar-right">
          <span className="live-dot" /> LOCAL AI · GEMMA
        </div>
      </header>

      <main ref={mainRef}>
        {!activeHub ? (
          <>
            <section className="hero-copy">
              <p className="eyebrow">YOUR TIME, WELL SPENT</p>
              <h1>A smarter way to <span>spend your screen time.</span></h1>
              <p className="intro">Learn, reset, connect, and keep your mind sharp — with a TV experience designed for the whole room.</p>
              <p className="remote-tip"><span>← ↑ ↓ →</span> Navigate <span>OK / ENTER</span> Select <span>ESC</span> Back</p>
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
                  onClick={() => openHub(hub)}
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
                <div><p className="eyebrow">A GOOD PLACE TO START</p><h2>Quick picks</h2></div>
                <p>Choose a card to ask Nexora AI</p>
              </div>
              <div className="quick-grid">
                {QUICK_IDEAS.map((idea) => (
                  <button className="quick-card" key={idea.title} type="button" data-tv-focus="true" onClick={() => { openHub(HUBS[4]); setMessage(idea.prompt); }}>
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
            <button className="back-button" type="button" data-tv-focus="true" data-back-button onClick={goHome}>← <span>Back to Home</span></button>
            <div className="view-heading">
              <div className={`large-hub-icon ${activeHub.color}`}>{activeHub.icon}</div>
              <div><p className="eyebrow">NEXORA EXPERIENCE</p><h1>{activeHub.title}</h1><p className="intro">{activeHub.desc}</p></div>
            </div>

            {activeHub.id === 'assistant' ? (
              <div className="assistant-layout">
                <div className="assistant-main panel">
                  <p className="eyebrow">YOUR PERSONAL ACTIVITY GUIDE</p>
                  <h2>What are you in the mood for?</h2>
                  <p className="panel-copy">Tell Nexora how you feel, how much time you have, or what you want to do. Your request is processed by the local AI on this computer.</p>
                  <div className="mood-row" aria-label="Quick mood prompts">
                    {MOODS.map((mood) => <button type="button" className="mood-chip" key={mood.label} data-tv-focus="true" onClick={() => usePrompt(mood.prompt)}>{mood.icon} {mood.label}</button>)}
                  </div>
                  <form className="ask-form" onSubmit={askAI}>
                    <label htmlFor="nexora-prompt">Your request</label>
                    <div className="input-row">
                      <input id="nexora-prompt" data-prompt-input data-tv-focus="true" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. I want to relax for 10 minutes…" autoComplete="off" disabled={loading} />
                      <button className="primary-button" type="submit" data-tv-focus="true" disabled={loading || !message.trim()}>{loading ? 'Thinking…' : 'Ask AI'} <span aria-hidden="true">→</span></button>
                    </div>
                  </form>
                  {loading && <div className="status panel-message" role="status"><span className="spinner" /> Gemma is thinking. The first response may take a little longer while the model loads.</div>}
                  {error && <div className="error-message" role="alert"><strong>Couldn't reach Nexora AI</strong><p>{error}</p><button type="button" className="text-button" data-tv-focus="true" onClick={() => usePrompt(lastPrompt || message)}>Try again</button></div>}
                  {reply && <div className="recommendation" aria-live="polite"><div className="recommendation-title"><span className="bot-icon">✦</span><div><p className="eyebrow">YOUR NEXT GOOD THING</p><h3>Nexora recommends</h3></div></div><p className="recommendation-text">{reply}</p><div className="recommendation-actions"><button type="button" data-tv-focus="true" className="secondary-button" onClick={() => { setMessage('Give me a different suggestion for: ' + lastPrompt); }}>Another idea ↻</button><button type="button" data-tv-focus="true" className="text-button" onClick={() => { setReply(''); setError(''); }}>Clear result</button></div></div>}
                </div>
                <aside className="assistant-aside panel">
                  <div className="aside-orb">✦</div><p className="eyebrow">MADE FOR YOUR MOMENT</p><h3>Small activities. Better breaks.</h3>
                  <ul className="benefit-list"><li>Suggestions matched to your mood</li><li>Short activities with clear steps</li><li>Four hubs, one helpful guide</li><li>Local AI via Ollama + Gemma</li></ul>
                  <div className="privacy-note"><span>🔒</span><p><strong>Local-first AI</strong><br />Your prompt is sent to the local Nexora backend and Ollama model on this machine.</p></div>
                </aside>
              </div>
            ) : (
              <div className="hub-placeholder panel">
                <div className="placeholder-art">{activeHub.icon}</div>
                <p className="eyebrow">YOUR NEXT GOOD THING</p>
                <h2>Make this moment count.</h2>
                <p className="panel-copy">Ask Nexora AI for a personalized {activeHub.title.toLowerCase()} activity based on your time and mood.</p>
                <button type="button" className="primary-button" data-tv-focus="true" onClick={() => { setMessage(`Suggest one activity for ${activeHub.title}. Make it beginner-friendly and give me clear steps.`); openHub(HUBS[4]); }}>Get an AI suggestion <span aria-hidden="true">→</span></button>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="footer"><span className="footer-brand">NEXORA <span>Fire TV</span></span><span>Learn · Relax · Connect · Grow</span><span>Open source · Local-first AI</span></footer>
    </div>
  );
}
