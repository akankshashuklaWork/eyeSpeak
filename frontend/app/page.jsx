'use client';

import { useEffect, useRef, useState } from 'react';
import { useGazeTracker } from '../hooks/useGazeTracker';
import { selectCategory } from '../lib/api';
import GazeCalibration from '../components/GazeCalibration';

const CARDS = [
  {
    id: 'water',
    label: 'Water',
    emoji: '💧',
    accent: '#22d3ee',
    glow: 'from-cyan-400/40 to-blue-500/5',
    border: 'border-cyan-300/20 hover:border-cyan-300/50',
  },
  {
    id: 'food',
    label: 'Food',
    emoji: '🍽️',
    accent: '#fbbf24',
    glow: 'from-amber-400/40 to-orange-500/5',
    border: 'border-amber-300/20 hover:border-amber-300/50',
  },
  {
    id: 'feeling',
    label: 'Feeling',
    emoji: '😊',
    accent: '#34d399',
    glow: 'from-emerald-400/40 to-teal-500/5',
    border: 'border-emerald-300/20 hover:border-emerald-300/50',
  },
  {
    id: 'medicine',
    label: 'Medicine',
    emoji: '💊',
    accent: '#a78bfa',
    glow: 'from-violet-400/40 to-purple-500/5',
    border: 'border-violet-300/20 hover:border-violet-300/50',
  },
  {
    id: 'emergency',
    label: 'Emergency',
    emoji: '🚨',
    accent: '#fb7185',
    glow: 'from-rose-500/50 to-red-600/10',
    border: 'border-rose-400/30 hover:border-rose-400/60',
    urgent: true,
  },
];

const DWELL_MS = 2000;
const POLL_MS = 50;

export default function PatientPage() {
  const { videoRef, gazePoint, gazePointRef, rawRatioRef, status, calibrated, calibrate, resetCalibration } =
    useGazeTracker();
  const cardRefs = useRef({});
  const dwellStartRef = useRef(null);
  const lockRef = useRef(false);

  const [dwell, setDwell] = useState({ id: null, progress: 0 });
  const [sentence, setSentence] = useState('');
  const [loading, setLoading] = useState(false);

  const needsCalibration = status === 'tracking' && !calibrated;

  useEffect(() => {
    const interval = setInterval(() => {
      if (lockRef.current || needsCalibration) return;
      const point = gazePointRef.current;
      if (!point) return;

      const hoveredId = findCardAtPoint(cardRefs.current, point);
      if (!hoveredId) {
        dwellStartRef.current = null;
        setDwell({ id: null, progress: 0 });
        return;
      }

      if (dwellStartRef.current?.id !== hoveredId) {
        dwellStartRef.current = { id: hoveredId, start: Date.now() };
      }

      const elapsed = Date.now() - dwellStartRef.current.start;
      const progress = Math.min(elapsed / DWELL_MS, 1);
      setDwell({ id: hoveredId, progress });

      if (progress >= 1) {
        lockRef.current = true;
        dwellStartRef.current = null;
        handleSelect(hoveredId);
      }
    }, POLL_MS);

    return () => clearInterval(interval);
  }, [gazePointRef, needsCalibration]);

  async function handleSelect(category) {
    setLoading(true);
    setSentence('');
    try {
      const result = await selectCategory(category);
      setSentence(result.sentence);
      speak(result.sentence);
    } catch (err) {
      console.error(err);
      setSentence("Sorry, I couldn't reach the AI service.");
    } finally {
      setLoading(false);
      setDwell({ id: null, progress: 0 });
      setTimeout(() => {
        lockRef.current = false;
      }, 1200);
    }
  }

  function speak(text) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  return (
    <main className="relative min-h-screen p-8">
      <a
        href="/caregiver"
        className="fixed left-6 top-6 z-20 inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/70 backdrop-blur-xl transition hover:bg-white/20 hover:text-white"
      >
        Caregiver view <span aria-hidden>→</span>
      </a>

      <div className="pointer-events-none fixed bottom-6 right-6 z-20 overflow-hidden rounded-2xl border border-white/20 bg-white/5 p-1 shadow-2xl backdrop-blur-xl">
        <video
          ref={videoRef}
          className="h-32 w-40 -scale-x-100 rounded-xl object-cover opacity-90"
          muted
          playsInline
        />
        {status === 'tracking' && (
          <span className="absolute left-3 top-3 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
        )}
      </div>

      {status === 'tracking' && !calibrated && (
        <GazeCalibration
          rawRatioRef={rawRatioRef}
          onComplete={(samples) => calibrate(samples)}
        />
      )}

      {gazePoint && status === 'tracking' && calibrated && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2"
          style={{ left: gazePoint.x, top: gazePoint.y }}
        >
          <div className="h-8 w-8 animate-ping rounded-full bg-cyan-400/30" />
          <div className="absolute inset-0 m-auto h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_14px_4px_rgba(34,211,238,0.65)]" />
        </div>
      )}

      <header className="relative z-10 mb-10 flex flex-col items-center gap-3 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2 shadow-lg backdrop-blur-xl">
          <span className="text-2xl">👁️</span>
          <h1 className="bg-gradient-to-r from-cyan-300 via-violet-300 to-rose-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            eyeSpeak
          </h1>
        </div>
        <p className="flex items-center gap-2 text-sm text-white/60">
          <span
            className={`h-2 w-2 rounded-full ${
              status === 'tracking'
                ? 'animate-pulse-glow bg-emerald-400'
                : status === 'loading'
                  ? 'animate-pulse bg-amber-400'
                  : 'bg-white/30'
            }`}
          />
          {status === 'loading' && 'Starting camera…'}
          {status === 'tracking' && !calibrated && 'Calibrating gaze…'}
          {status === 'tracking' && calibrated && 'Look at a card for 2 seconds to select it.'}
          {status === 'unavailable' && 'Eye tracking unavailable — tap a card instead.'}
        </p>
        {status === 'tracking' && calibrated && (
          <button onClick={resetCalibration} className="text-xs text-white/40 underline hover:text-white/70">
            Recalibrate
          </button>
        )}
      </header>

      <div className="relative z-10 mx-auto grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-3">
        {CARDS.map((card) => (
          <button
            key={card.id}
            ref={(el) => (cardRefs.current[card.id] = el)}
            onClick={() => !loading && handleSelect(card.id)}
            className={`group relative flex aspect-square flex-col items-center justify-center gap-3 overflow-hidden rounded-[2rem] border ${card.border} bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white/15 active:scale-95`}
          >
            <div
              className={`absolute -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${card.glow} blur-2xl transition-transform duration-500 group-hover:scale-125`}
            />
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/15 via-transparent to-transparent" />
            {card.urgent && (
              <div className="pointer-events-none absolute inset-0 animate-pulse-glow rounded-[2rem] ring-2 ring-rose-400/40" />
            )}

            <span className="relative text-6xl drop-shadow-[0_4px_14px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:scale-110">
              {card.emoji}
            </span>
            <span className="relative text-xl font-semibold tracking-wide text-white">{card.label}</span>

            {dwell.id === card.id && dwell.progress > 0 && (
              <svg className="pointer-events-none absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke={card.accent}
                  strokeWidth="4"
                  strokeDasharray={289}
                  strokeDashoffset={289 * (1 - dwell.progress)}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 6px ${card.accent})` }}
                />
              </svg>
            )}
          </button>
        ))}
      </div>

      <div className="relative z-10 mx-auto mt-10 max-w-2xl text-center">
        {loading && (
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-xl">
            <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-violet-300 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-rose-300" />
          </div>
        )}
        {sentence && !loading && (
          <div
            key={sentence}
            className="animate-fade-in-up rounded-3xl border border-white/15 bg-white/10 px-8 py-6 shadow-2xl backdrop-blur-xl"
          >
            <p className="text-sm uppercase tracking-widest text-white/40">eyeSpeak says</p>
            <p className="mt-2 text-2xl font-medium text-white">&ldquo;{sentence}&rdquo;</p>
          </div>
        )}
      </div>
    </main>
  );
}

function findCardAtPoint(refs, point) {
  for (const [id, el] of Object.entries(refs)) {
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom) {
      return id;
    }
  }
  return null;
}
