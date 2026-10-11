import React, { useState, useEffect, useRef } from 'react';
import './App.css';

export default function App() {
  // Navigation & View State
  const [currentView, setCurrentView] = useState('home'); // 'home', 'category', 'activity'
  const [activeCategory, setActiveCategory] = useState(null); // 'learning', 'wellness', 'family', 'daily-brain'
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Focus Management Index for TV D-Pad
  const [focusIndex, setFocusIndex] = useState(0);

  // Interactive Quiz State
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Wellness Timer State
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  // Daily Puzzle State
  const [puzzleAnswer, setPuzzleAnswer] = useState('');
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [puzzleMessage, setPuzzleMessage] = useState('');

  // Data definitions
  const categories = [
    { id: 'learning', name: 'Learning', desc: 'Expand your mind with quizzes and science.', icon: '🎓', color: 'from-blue-600 to-cyan-600' },
    { id: 'wellness', name: 'Wellness', desc: 'Take a breather, rest your eyes, and stretch.', icon: '🧘', color: 'from-cyan-600 to-teal-600' },
    { id: 'family', name: 'Family', desc: 'Fun interactive games and wholesome bonding.', icon: '👨‍👩‍👧‍👦', color: 'from-indigo-600 to-blue-600' },
    { id: 'daily-brain', name: 'Daily Brain Challenge', desc: 'Solve today’s number puzzle.', icon: '🧩', color: 'from-purple-600 to-indigo-600' }
  ];

  const categoryItems = {
    learning: [
      { id: 'quick-quiz', name: 'Quick Quiz', type: 'quiz', desc: 'Test your knowledge across multiple trivia subjects.', icon: '❓' },
      { id: 'explore-science', name: 'Explore Science', type: 'science', desc: 'Discover fascinating facts about our universe.', icon: '🔬' },
      { id: 'daily-challenge', name: 'Daily Challenge', type: 'daily-challenge', desc: 'Brain teasers updated daily.', icon: '⭐' }
    ],
    wellness: [
      { id: 'breathing-break', name: 'Breathing Break', type: 'breathing', desc: 'Guided box-breathing to center your mind.', icon: '🫁' },
      { id: 'eye-rest', name: 'Eye Rest', type: 'eye-rest', desc: 'Relax your eyes from screen fatigue.', icon: '👁️' },
      { id: 'movement-break', name: 'Movement Break', type: 'movement', desc: 'Quick posture correction and stretches.', icon: '🤸' }
    ],
    family: [
      { id: 'charades', name: 'Family Charades Prompts', type: 'charades', desc: 'Fun prompts for movie and animal charades.', icon: '🎭' },
      { id: 'trivia-night', name: 'Family Trivia Night', type: 'family-trivia', desc: 'General knowledge questions suitable for all ages.', icon: '🌟' },
      { id: 'gratitude-circle', name: 'Gratitude Circle', type: 'gratitude', desc: 'Share highlights and positive thoughts together.', icon: '💖' }
    ]
  };

  const quizQuestions = [
    {
      question: 'Which planet in our solar system is known as the Red Planet?',
      options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
      answer: 1
    },
    {
      question: 'What is the chemical symbol for water?',
      options: ['O2', 'H2O', 'CO2', 'NaCl'],
      answer: 1
    },
    {
      question: 'How many colors are in a standard rainbow?',
      options: ['5', '6', '7', '8'],
      answer: 2
    },
    {
      question: 'Which gas do plants absorb from the atmosphere?',
      options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Helium'],
      answer: 1
    }
  ];

  const scienceFacts = [
    { title: 'The Speed of Light', fact: 'Light travels at approximately 299,792 kilometers per second. Sunlight takes about 8 minutes and 20 seconds to reach Earth!' },
    { title: 'The Vastness of Space', fact: 'There are more trees on Earth than stars in the Milky Way galaxy—estimated over 3 trillion trees compared to 100-400 billion stars.' },
    { title: 'Water on Earth', fact: 'About 71% of the Earth\'s surface is covered by water, and oceans hold about 96.5% of all Earth\'s water.' }
  ];

  const charadePrompts = [
    'Act out riding a roller coaster!',
    'Act out brushing your teeth while wearing mittens!',
    'Act out building a snowman in summer!',
    'Act out a penguin trying to fly!'
  ];

  const gratitudePrompts = [
    'What was the funniest thing that happened to you this week?',
    'Who is someone you are grateful for and why?',
    'What is a new skill you would love to learn together as a family?'
  ];

  // Ref array to hold focusable DOM elements
  const focusableRefs = useRef([]);

  // Determine total focusable elements on current view
  const getFocusableCount = () => {
    if (currentView === 'home') {
      return categories.length;
    } else if (currentView === 'category') {
      if (activeCategory === 'daily-brain') return 2; // Input + Submit
      const items = categoryItems[activeCategory] || [];
      return items.length + 1; // +1 for Back button
    } else if (currentView === 'activity') {
      if (selectedActivity?.type === 'quiz') {
        if (quizCompleted) return 2; // Restart + Back
        return quizQuestions[currentQuestionIndex].options.length + 1; // Options + Back
      }
      if (selectedActivity?.type === 'breathing') {
        return 2; // Start/Stop timer + Back
      }
      return 1; // Back button default
    }
    return 1;
  };

  const totalFocusables = getFocusableCount();

  // Reset focus index when view changes
  useEffect(() => {
    setFocusIndex(0);
  }, [currentView, activeCategory, selectedActivity, quizCompleted]);

  // Handle TV Remote D-pad key events
  useEffect(() => {
    const handleKeyDown = (e) => {
      let newIndex = focusIndex;
      const count = getFocusableCount();

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        newIndex = (focusIndex + 1) % count;
        setFocusIndex(newIndex);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        newIndex = (focusIndex - 1 + count) % count;
        setFocusIndex(newIndex);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        // Trigger click on currently focused element if available
        if (focusableRefs.current[focusIndex]) {
          focusableRefs.current[focusIndex].click();
        }
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusIndex, currentView, activeCategory, selectedActivity, quizCompleted, quizStarted, currentQuestionIndex, selectedOption]);

  // Timer effect for wellness breathing
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const handleBack = () => {
    if (currentView === 'activity') {
      setSelectedActivity(null);
      setCurrentView('category');
    } else if (currentView === 'category') {
      setActiveCategory(null);
      setCurrentView('home');
    }
  };

  const selectCategory = (catId) => {
    setActiveCategory(catId);
    if (catId === 'daily-brain') {
      setCurrentView('activity');
      setSelectedActivity({ id: 'daily-brain', name: 'Daily Brain Challenge', type: 'daily-brain' });
    } else {
      setCurrentView('category');
    }
  };

  const selectActivityItem = (item) => {
    setSelectedActivity(item);
    setCurrentView('activity');
    if (item.type === 'quiz') {
      setQuizStarted(true);
      setCurrentQuestionIndex(0);
      setQuizScore(0);
      setQuizCompleted(false);
      setSelectedOption(null);
    }
    if (item.type === 'breathing') {
      setTimeLeft(60);
      setTimerActive(false);
    }
  };

  const handleQuizAnswer = (optionIndex) => {
    setSelectedOption(optionIndex);
    const currentQ = quizQuestions[currentQuestionIndex];
    const isCorrect = optionIndex === currentQ.answer;
    if (isCorrect) {
      setQuizScore((prev) => prev + 1);
    }

    setTimeout(() => {
      setSelectedOption(null);
      if (currentQuestionIndex + 1 < quizQuestions.length) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        setQuizCompleted(true);
      }
    }, 800);
  };

  const handlePuzzleSubmit = (e) => {
    e.preventDefault();
    // Puzzle: "What number comes next: 2, 4, 8, 16, ?" Answer: 32
    if (puzzleAnswer.trim() === '32') {
      setPuzzleSolved(true);
      setPuzzleMessage('Correct! Excellent logical deduction.');
    } else {
      setPuzzleMessage('Not quite right. Hint: Each number doubles!');
    }
  };

  return (
    <div className="tv-container bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 flex flex-col justify-between p-8 select-none font-sans overflow-hidden">
      
      {/* Header */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-3xl font-black shadow-lg shadow-cyan-500/30 glow-effect">
            N
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              NEXORA
            </h1>
            <p className="text-sm text-cyan-300/80 font-medium tracking-wide">
              Make your screen time time well spent
            </p>
          </div>
        </div>

        {currentView !== 'home' && (
          <button
            ref={(el) => (focusableRefs.current[0] = el)}
            onClick={handleBack}
            className={`tv-focusable px-6 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-cyan-300 font-bold text-lg flex items-center space-x-2 shadow-md ${
              focusIndex === 0 ? 'focused' : ''
            }`}
          >
            <span>⬅ Back</span>
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 my-6 overflow-y-auto flex flex-col justify-center px-4">
        
        {/* VIEW 1: HOME (Categories) */}
        {currentView === 'home' && (
          <div className="space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <h2 className="text-4xl font-black tracking-tight text-white">
                Welcome to Nexora TV
              </h2>
              <p className="text-lg text-slate-300">
                Choose a category below using your remote to explore enriching activities, learning, and family fun.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto w-full">
              {categories.map((cat, idx) => (
                <button
                  key={cat.id}
                  ref={(el) => (focusableRefs.current[idx] = el)}
                  onClick={() => selectCategory(cat.id)}
                  className={`tv-focusable text-left p-8 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 flex flex-col justify-between h-72 shadow-xl group cursor-pointer ${
                    focusIndex === idx ? 'focused' : ''
                  }`}
                >
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-3xl shadow-lg mb-6 group-hover:scale-110 transition-transform`}>
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{cat.name}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2">{cat.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: CATEGORY ITEMS */}
        {currentView === 'category' && activeCategory && activeCategory !== 'daily-brain' && (
          <div className="space-y-8 max-w-5xl mx-auto w-full">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-extrabold capitalize text-white">
                {activeCategory} Hub
              </h2>
              <p className="text-slate-400 text-lg">Select an activity to begin</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categoryItems[activeCategory]?.map((item, idx) => (
                <button
                  key={item.id}
                  ref={(el) => (focusableRefs.current[idx + 1] = el)} // index 0 reserved for Back button
                  onClick={() => selectActivityItem(item)}
                  className={`tv-focusable p-6 rounded-2xl bg-slate-900/90 border border-slate-800 text-left flex flex-col justify-between h-56 shadow-lg cursor-pointer ${
                    focusIndex === idx + 1 ? 'focused' : ''
                  }`}
                >
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: ACTIVITY DETAIL SCREEN */}
        {currentView === 'activity' && selectedActivity && (
          <div className="max-w-4xl mx-auto w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
            
            {/* 1. QUIZ ACTIVITY */}
            {selectedActivity.type === 'quiz' && (
              <div>
                {!quizCompleted ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center text-cyan-400 font-semibold text-lg border-b border-slate-800 pb-4">
                      <span>Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                      <span>Score: {quizScore}</span>
                    </div>

                    <h3 className="text-2xl font-bold text-white">
                      {quizQuestions[currentQuestionIndex].question}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      {quizQuestions[currentQuestionIndex].options.map((option, idx) => {
                        let btnStyle = "bg-slate-800/90 border-slate-700 text-white";
                        if (selectedOption !== null) {
                          if (idx === quizQuestions[currentQuestionIndex].answer) {
                            btnStyle = "bg-emerald-600/90 border-emerald-500 text-white";
                          } else if (idx === selectedOption) {
                            btnStyle = "bg-rose-600/90 border-rose-500 text-white";
                          }
                        }

                        return (
                          <button
                            key={idx}
                            ref={(el) => (focusableRefs.current[idx + 1] = el)}
                            onClick={() => selectedOption === null && handleQuizAnswer(idx)}
                            className={`tv-focusable p-5 rounded-xl border text-left font-semibold text-lg transition-all ${btnStyle} ${
                              focusIndex === idx + 1 ? 'focused' : ''
                            }`}
                          >
                            <span className="text-cyan-400 mr-3">[{idx + 1}]</span>
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-6 py-8">
                    <div className="text-6xl mb-2">🏆</div>
                    <h3 className="text-3xl font-bold text-white">Quiz Completed!</h3>
                    <p className="text-xl text-cyan-300">
                      Your Final Score: {quizScore} / {quizQuestions.length}
                    </p>
                    <div className="flex justify-center space-x-4 pt-6">
                      <button
                        ref={(el) => (focusableRefs.current[1] = el)}
                        onClick={() => {
                          setQuizCompleted(false);
                          setCurrentQuestionIndex(0);
                          setQuizScore(0);
                          setSelectedOption(null);
                        }}
                        className={`tv-focusable px-8 py-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-lg shadow-lg ${
                          focusIndex === 1 ? 'focused' : ''
                        }`}
                      >
                        Restart Quiz
                      </button>
                      <button
                        ref={(el) => (focusableRefs.current[2] = el)}
                        onClick={handleBack}
                        className={`tv-focusable px-8 py-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-lg ${
                          focusIndex === 2 ? 'focused' : ''
                        }`}
                      >
                        Back to Hub
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. SCIENCE EXPLORER */}
            {selectedActivity.type === 'science' && (
              <div className="space-y-6">
                <h3 className="text-3xl font-extrabold text-cyan-400 flex items-center space-x-3">
                  <span>🔬</span>
                  <span>Explore Science Facts</span>
                </h3>
                <div className="space-y-4">
                  {scienceFacts.map((item, idx) => (
                    <div key={idx} className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                      <h4 className="text-xl font-bold text-white">{item.title}</h4>
                      <p className="text-slate-300 leading-relaxed text-lg">{item.fact}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. BREATHING BREAK */}
            {selectedActivity.type === 'breathing' && (
              <div className="text-center space-y-8 py-4">
                <h3 className="text-3xl font-extrabold text-cyan-400">Guided Breathing Break</h3>
                <p className="text-slate-300 text-lg">Inhale slowly as the timer counts down, and release tension.</p>

                <div className="w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-4 border-cyan-400 flex items-center justify-center shadow-2xl glow-effect">
                  <span className="text-5xl font-black text-white">{timeLeft}s</span>
                </div>

                <div className="flex justify-center space-x-4">
                  <button
                    ref={(el) => (focusableRefs.current[1] = el)}
                    onClick={() => setTimerActive(!timerActive)}
                    className={`tv-focusable px-8 py-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-lg shadow-lg ${
                      focusIndex === 1 ? 'focused' : ''
                    }`}
                  >
                    {timerActive ? 'Pause Session' : 'Start 60s Session'}
                  </button>
                  <button
                    ref={(el) => (focusableRefs.current[2] = el)}
                    onClick={() => { setTimerActive(false); setTimeLeft(60); }}
                    className={`tv-focusable px-8 py-4 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-lg ${
                      focusIndex === 2 ? 'focused' : ''
                    }`}
                  >
                    Reset Timer
                  </button>
                </div>
              </div>
            )}

            {/* 4. EYE REST & MOVEMENT BREAK */}
            {(selectedActivity.type === 'eye-rest' || selectedActivity.type === 'movement') && (
              <div className="space-y-6 text-center py-6">
                <div className="text-6xl mb-4">{selectedActivity.icon}</div>
                <h3 className="text-3xl font-bold text-white">{selectedActivity.name}</h3>
                <p className="text-slate-300 text-xl max-w-2xl mx-auto leading-relaxed">
                  {selectedActivity.type === 'eye-rest'
                    ? 'Look away from your screen at an object at least 20 feet away for 20 seconds. Blink slowly to lubricate and refresh your eyes.'
                    : 'Stand up tall, roll your shoulders backward 5 times, reach your hands towards the ceiling, and take 3 deep, refreshing breaths!'}
                </p>
              </div>
            )}

            {/* 5. FAMILY CHARADES & GRATITUDE */}
            {(selectedActivity.type === 'charades' || selectedActivity.type === 'gratitude') && (
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-cyan-400">{selectedActivity.name}</h3>
                <div className="space-y-4">
                  {(selectedActivity.type === 'charades' ? charadePrompts : gratitudePrompts).map((prompt, idx) => (
                    <div key={idx} className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center space-x-4">
                      <span className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <p className="text-white text-lg font-medium">{prompt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. DAILY BRAIN CHALLENGE & FAMILY TRIVIA */}
            {(selectedActivity.type === 'daily-brain' || selectedActivity.type === 'family-trivia') && (
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-cyan-400">Daily Number Puzzle</h3>
                <p className="text-slate-300 text-lg">What number comes next in the sequence: <strong className="text-white">2, 4, 8, 16, ?</strong></p>

                <form onSubmit={handlePuzzleSubmit} className="space-y-4 pt-2">
                  <div className="flex space-x-4">
                    <input
                      ref={(el) => (focusableRefs.current[1] = el)}
                      type="text"
                      value={puzzleAnswer}
                      onChange={(e) => setPuzzleAnswer(e.target.value)}
                      placeholder="Enter your answer..."
                      className={`tv-focusable flex-1 px-6 py-4 rounded-xl bg-slate-950 border border-slate-700 text-white text-lg focus:outline-none ${
                        focusIndex === 1 ? 'focused' : ''
                      }`}
                    />
                    <button
                      ref={(el) => (focusableRefs.current[2] = el)}
                      type="submit"
                      className={`tv-focusable px-8 py-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-lg shadow-lg ${
                        focusIndex === 2 ? 'focused' : ''
                      }`}
                    >
                      Submit Answer
                    </button>
                  </div>
                </form>

                {puzzleMessage && (
                  <div className={`p-4 rounded-xl text-lg font-semibold ${puzzleSolved ? 'bg-emerald-950/80 border border-emerald-600 text-emerald-300' : 'bg-rose-950/80 border border-rose-600 text-rose-300'}`}>
                    {puzzleMessage}
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 pt-4 flex justify-between items-center text-sm text-slate-400">
        <div>Amazon Developer Hackathon 2026 — Fire TV Track</div>
        <div className="flex items-center space-x-4">
          <span>🎮 Use D-Pad / Arrow Keys</span>
          <span>•</span>
          <span>⚡ Enter to Select</span>
          <span>•</span>
          <span>⬅ Backspace/Esc to Return</span>
        </div>
      </footer>

    </div>
  );
}